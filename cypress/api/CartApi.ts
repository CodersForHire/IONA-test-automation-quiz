class CartApi {

    
    removeAllItems(username:string, password:string) {
        const apiURL:string = 'https://api.demoblaze.com';
        const encodedPassword = btoa(password);

        return cy.request({
                method: 'POST',
                url: apiURL+'/login',
                body: {
                    username: username,
                    password: encodedPassword
                }
            }).then((response) => {
                cy.log(response.body)
                const token = response.body.replace('Auth_token: ', '');
                cy.log(token)

                cy.request({
                    method: 'POST',
                    url: apiURL+'/viewcart',
                    body: {"cookie": token ,"flag":true}
                }).then((getResponse) =>{
                    cy.log(getResponse.body);

                    for(let i=0; i<getResponse.body.Items.length; i++){
                        cy.request({
                            method: 'POST',
                            url: apiURL+'/deleteitem',
                            body: {id: getResponse.body.Items[i].id}
                        })
                        cy.log("deleted:"+ getResponse.body.Items[i].id)
                    }
                })
            });
    }
}


export default new CartApi(); 