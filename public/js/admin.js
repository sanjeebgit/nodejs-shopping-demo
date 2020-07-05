const deleteProduct = (btn) => {
    // console.log('Clicked', btn);
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest('article');

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            console.log(data);
            productElement.parentNode.removeChild(productElement);
        })
        .catch(err => {
            console.log(err);
        });
}




// call this function on load of page
const checkoutTest = () => {
    var stripe = Stripe('pk_test_51GrnJXJqXwBFE1XE31YjVKyEuX1ZDwzrffgdk0SKmp7Wqb6AePaIQOcO3M82gt1LBKjDXSICG2RMISC5hVi2iySx00brrF5WDK');

    var elements = stripe.elements();
    var style = {
        base: {
          color: "#32325d",
        }
      };
      var card = elements.create("card", { style: style });
      card.mount("#card-element");
    // stripe.redirectToCheckout({
    //        }).then(function (result) {
       
    //   });
  
}
