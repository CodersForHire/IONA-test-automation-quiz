#!/usr/bin/env bash
#
# Run the Playwright suite inside the official Playwright container.
#
# Why a container: the browsers, their system libraries and the Node version are
# pinned by the image, so a run here is the same run on a laptop, on a CI agent
# and on a colleague's machine. It is also the only way to reproduce a
# Linux-only failure from a Windows or macOS host.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CONTAINER_WORKDIR="/work"

# Git Bash / MSYS rewrites arguments that look like absolute POSIX paths into
# Windows paths before exec'ing a native binary, so `--workdir /work` reaches
# Docker as `C:/Program Files/Git/work`. Turn the rewriting off for this process
# and hand Docker a Windows-shaped host path instead, since it can no longer
# translate /c/... for us.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    export MSYS_NO_PATHCONV=1
    export MSYS2_ARG_CONV_EXCL='*'
    REPO_ROOT="$(cygpath -m "${REPO_ROOT}")"
    ;;
esac

# node_modules is a container-only named volume on purpose: the host tree is
# built for the host OS, and letting the container's `npm ci` write into the
# bind mount would replace the host's binaries with Linux ones (and vice versa).
NODE_MODULES_VOLUME="iona-pw-node-modules"

usage() {
  cat <<'EOF'
Run the Playwright suite in a Docker container.

Usage:
  ./playwright/ronelgeronimo/scripts/run-in-docker.sh [options] [-- <playwright args>]

Options:
  -e, --env <name>       TEST_ENV: dev | test | staging  (default: whatever .env sets)
  -w, --workers <n|n%>   PW_WORKERS override for this run
  -p, --project <name>   Browser project; repeatable (chromium | firefox | webkit)
  -g, --grep <pattern>   Only run tests matching the pattern, e.g. @smoke
      --cpus <n>         Limit the container to n CPUs
      --shell            Open a shell in the container instead of running tests
      --pull             Pull the image before running
      --clean            Delete the cached node_modules volume, then run
  -h, --help             Show this help

Anything after `--` is passed straight to `playwright test`:
  ./run-in-docker.sh -p chromium -- playwright/ronelgeronimo/tests/e2e

Examples:
  ./run-in-docker.sh                              # whole suite, all browsers
  ./run-in-docker.sh -p chromium -g @smoke        # smoke tests, Chromium only
  ./run-in-docker.sh -e staging -w 2 --cpus 2     # staging, two workers, two CPUs

Environment:
  PW_IMAGE   Override the image. Defaults to the Playwright version pinned in
             package-lock.json, e.g. mcr.microsoft.com/playwright:v1.53.2-noble

Credentials come from the repository's .env, which is visible in the container
through the bind mount. Reports land in playwright-report/ and test-results/ on
the host for the same reason.
EOF
}

TEST_ENV=""
WORKERS=""
GREP=""
CPUS=""
OPEN_SHELL=false
PULL=false
CLEAN=false
PROJECTS=()
PW_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)     TEST_ENV="${2:?--env needs a value}"; shift 2 ;;
    -w|--workers) WORKERS="${2:?--workers needs a value}"; shift 2 ;;
    -p|--project) PROJECTS+=("--project=${2:?--project needs a value}"); shift 2 ;;
    -g|--grep)    GREP="${2:?--grep needs a value}"; shift 2 ;;
    --cpus)       CPUS="${2:?--cpus needs a value}"; shift 2 ;;
    --shell)      OPEN_SHELL=true; shift ;;
    --pull)       PULL=true; shift ;;
    --clean)      CLEAN=true; shift ;;
    -h|--help)    usage; exit 0 ;;
    --)           shift; PW_ARGS+=("$@"); break ;;
    *)            PW_ARGS+=("$1"); shift ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not on PATH. Install Docker Desktop or the Docker engine." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but not running. Start it and try again." >&2
  exit 1
fi

# The image has to match the Playwright version the suite actually installs, or
# the bundled browsers and the client library disagree about the protocol.
# package-lock.json is the version that `npm ci` will resolve to.
if [[ -z "${PW_IMAGE:-}" ]]; then
  PW_VERSION="$(
    grep -A1 '"node_modules/@playwright/test"' "${REPO_ROOT}/package-lock.json" \
      | sed -n 's/.*"version": "\([^"]*\)".*/\1/p' \
      | head -n 1
  )"
  if [[ -z "${PW_VERSION}" ]]; then
    echo "Could not read the @playwright/test version from package-lock.json." >&2
    echo "Set PW_IMAGE by hand, e.g. PW_IMAGE=mcr.microsoft.com/playwright:v1.53.2-noble" >&2
    exit 1
  fi
  PW_IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"
fi

if [[ "${CLEAN}" == true ]]; then
  docker volume rm "${NODE_MODULES_VOLUME}" >/dev/null 2>&1 || true
fi

if [[ "${PULL}" == true ]]; then
  docker pull "${PW_IMAGE}"
fi

DOCKER_ARGS=(
  --rm
  # Chromium exhausts the default 64MB /dev/shm and crashes part-way through a run.
  --ipc=host
  --volume "${REPO_ROOT}:${CONTAINER_WORKDIR}"
  --volume "${NODE_MODULES_VOLUME}:${CONTAINER_WORKDIR}/node_modules"
  --workdir "${CONTAINER_WORKDIR}"
  --env CI
)

# On a Linux host the bind mount keeps the container's ownership, so anything the
# root user in the container writes lands as root-owned on the host. Hand the
# output directories back afterwards. Windows and macOS mounts do their own
# ownership translation and need none of this.
if [[ "$(uname -s)" == "Linux" ]]; then
  DOCKER_ARGS+=(--env "HOST_UID=$(id -u)" --env "HOST_GID=$(id -g)")
fi

if [[ -n "${TEST_ENV}" ]]; then
  DOCKER_ARGS+=(--env "TEST_ENV=${TEST_ENV}")
fi

if [[ -n "${WORKERS}" ]]; then
  DOCKER_ARGS+=(--env "PW_WORKERS=${WORKERS}")
fi

if [[ -n "${CPUS}" ]]; then
  DOCKER_ARGS+=(--cpus "${CPUS}")
fi

if [[ -t 0 ]]; then
  DOCKER_ARGS+=(--interactive --tty)
fi

if [[ "${OPEN_SHELL}" == true ]]; then
  exec docker run "${DOCKER_ARGS[@]}" "${PW_IMAGE}" bash
fi

TEST_CMD=(npx playwright test)
if [[ ${#PROJECTS[@]} -gt 0 ]]; then
  TEST_CMD+=("${PROJECTS[@]}")
fi
if [[ -n "${GREP}" ]]; then
  TEST_CMD+=(--grep "${GREP}")
fi
if [[ ${#PW_ARGS[@]} -gt 0 ]]; then
  TEST_CMD+=("${PW_ARGS[@]}")
fi

printf 'Image   : %s\n' "${PW_IMAGE}"
printf 'Repo    : %s\n' "${REPO_ROOT}"
printf 'Command : %s\n\n' "${TEST_CMD[*]}"

# `npm ci` runs inside the container against the cached volume, so the first run
# is slow and later ones are not. --clean forces a reinstall.
docker run "${DOCKER_ARGS[@]}" "${PW_IMAGE}" bash -c '
  set -uo pipefail

  hand_back_outputs() {
    if [ "$(id -u)" = "0" ] && [ -n "${HOST_UID:-}" ]; then
      chown -R "${HOST_UID}:${HOST_GID}" playwright-report test-results 2>/dev/null || true
    fi
  }
  trap hand_back_outputs EXIT

  if [ ! -x node_modules/.bin/playwright ]; then
    echo "Installing dependencies (first run only)..."
    npm ci --no-audit --no-fund || exit 1
  fi

  "$@"
' _ "${TEST_CMD[@]}"
