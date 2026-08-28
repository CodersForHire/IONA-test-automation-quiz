import LoginPage from '../../pages/LoginPage'

describe ('Login tests', () => {

    // 3a. Empty checkout form
    it('returns error for invalid credentials', () => {

        LoginPage.visit(); 
        LoginPage.setUsername('invalidUser');
        LoginPage.setPassword('invalidPass');
        LoginPage.clickLoginButton(); 

        LoginPage.getAlertMessage()
            .should('have.been.calledWith', 'Wrong password.');    

    });

    //Extra negative test case when both username and password are missing
    it('returns error when username and password are missing', () => {

        LoginPage.visit(); 
        LoginPage.clickLoginButton(); 

        LoginPage.getAlertMessage()
            .should('have.been.calledWith', 'Please fill out Username and Password.'); 

    });
});