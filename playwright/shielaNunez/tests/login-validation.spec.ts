import { test } from '../fixtures/pageFixtures';
import { loginData } from '../test-data/loginData';

test.describe('Login Validation', () => {
    test('Should be able to validate when entered invalid login credentials', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step('When the user logs in with invalid credentials', async () => {
            await pages.loginModal.loginExpectingValidationError(
                loginData.invalidUser.username,
                loginData.invalidUser.password
            );
        });

        await test.step('Then the invalid login message should be displayed', async () => {
            await pages.loginModal.verifyInvalidLoginMsg('Wrong password.');
        });
    });

    test('Should be able to validate when logged in without username', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step('When the user logs in without a username', async () => {
            await pages.loginModal.loginExpectingValidationError(
                '',
                loginData.validUser.password
            );
        });

        await test.step('Then the required username and password message should be displayed', async () => {
            await pages.loginModal.verifyInvalidLoginMsg(
                'Please fill out Username and Password.'
            );
        });
    });

    test('Should be able to validate when logged in without password', async ({ pages }) => {
        await test.step('Given the user is on the home page', async () => {
            await pages.homePage.openHomePage();
        });

        await test.step('When the user logs in without a password', async () => {
            await pages.loginModal.loginExpectingValidationError(
                loginData.validUser.username,
                ''
            );
        });

        await test.step('Then the required username and password message should be displayed', async () => {
            await pages.loginModal.verifyInvalidLoginMsg(
                'Please fill out Username and Password.'
            );
        });
    });
});