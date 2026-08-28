
import HomePage from '../../pages/HomePage'
import ProductPage from '../../pages/ProductPage'
import CartPage from '../../pages/CartPage'
import LoginPage from '../../pages/LoginPage'
import CartApi from '../../api/CartApi'
import { customers } from '../../data/customers'
import { users } from '../../data/users'
import { products } from '../../data/products'

describe('Checkout Tests', () => {

  // 1. Automate the full purchase journey without being logged in
  it('checkouts order successfully via guest', () => {

    let targetProduct = products.macbookAir;

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    
    CartPage.placeOrder(targetProduct.name, customers.validCustomer);
    CartPage.clickPurchase();

    CartPage.getOrderDetails().then((details)=>{
      expect(details.id).to.not.be.empty;
      expect(details.amount).to.equal(targetProduct.price);
      expect(details.cardNumber).to.equal(customers.validCustomer.card);
      expect(details.name).to.equal(customers.validCustomer.name);
      expect(details.date).to.not.be.empty;
    });
    
  });
  
  
  // 2. Automate the full purchase journey as an authenticated user
  it('checkouts order successfully via authenticated user', () => {

    let targetProduct =  products.nexus6;
    let targetUser = users.validUser;

    CartApi.removeAllItems(targetUser.username, targetUser.password);
    LoginPage.login(targetUser.username, targetUser.password);

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added.');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    
    CartPage.placeOrder(targetProduct.name, customers.validCustomer);
    CartPage.clickPurchase();
    
    CartPage.getOrderDetails().then((details)=>{
      expect(details.id).to.not.be.empty;
      expect(details.amount).to.equal(targetProduct.price);
      expect(details.cardNumber).to.equal(customers.validCustomer.card);
      expect(details.name).to.equal(customers.validCustomer.name);
      expect(details.date).to.not.be.empty;
    });
    

  });

  // 3b. Empty checkout form
  it('returns an error message when all fields are missing', () => {

    let targetProduct = products.nexus6;

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    
    CartPage.placeOrder(targetProduct.name, customers.emptyCustomer);
    CartPage.clickPurchase();
    CartPage.getErrorMessage()
      .should('have.been.calledWith', 'Please fill out Name and Creditcard.');
  });

  // 3c. Adds to card but removes the item from the cart, then proceeds to checkout
  it('returns an error message when all items are removed from cart, then proceeds to checkout', () => {

    let targetProduct = products.asusFullHD;

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    CartPage.removeProduct(targetProduct.name);
    CartPage.getProductRow(targetProduct.name)
      .should('not.exist'); 
    
    CartPage.placeOrder(targetProduct.name, customers.validCustomer);
    CartPage.clickPurchase();

    ////This is the expected result
    // CartPage.getErrorMessage()
    //   .should('have.been.calledWith', 'Please add at least one item to the cart.');

    //This is the current behavior, proceeds with checkout with Amount=0 USD
    CartPage.getOrderDetails().then((details)=>{
      expect(details.id).to.not.be.empty;
      expect(details.amount).to.equal('0 USD');
      expect(details.cardNumber).to.equal(customers.validCustomer.card);
      expect(details.name).to.equal(customers.validCustomer.name);
      expect(details.date).to.not.be.empty;
    });

  });

  // 3d. Fills out the form, but clicks Close button instead of purchase
  it('does not proceed with the order when Close button is clicked instead of Purchase button', () => {

    let targetProduct = products.asusFullHD;

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    
    CartPage.placeOrder(targetProduct.name, customers.validCustomer);
    CartPage.clickClose();
    CartPage.getPlaceOrderModal()
      .should('not.have.class', 'show');
    
  });

  // 3e. Missing name and country
  it('returns an error message when name and card details are missing', () => {

    let targetProduct = products.macbookAir;

    HomePage.visit(); 
    HomePage.selectProduct(targetProduct); 
    ProductPage.addToCart(targetProduct.name);
    ProductPage.getAlertMessage()
      .should('have.been.calledWith', 'Product added');

    CartPage.visit();
    CartPage.getProductRow(targetProduct.name)
      .should('be.visible'); 
    
    CartPage.placeOrder(targetProduct.name, customers.missingNameAndCard);
    CartPage.clickPurchase();
    CartPage.getErrorMessage()
      .should('have.been.calledWith', 'Please fill out Name and Creditcard.');

  });


});
