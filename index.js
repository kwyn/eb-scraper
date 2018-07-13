const Nightmare = require("nightmare");
const Promise = require("bluebird");
const nightmare = Nightmare({
  openDevTools: {
    mode: "detach"
  },
  show: true
});
const sign_in_info = {
  email: "kwyn.meagher@gmail.com",
  pw: "kumagorou",
  payment_method: "WALLET_12487125"
};

const promiseWhile = (condition, action) => {
  const resolver = Promise.defer();

  const loop = function() {
    if (!condition()) return resolver.resolve();
    return Promise.cast(action())
      .delay(1000 + Math.random() * 1000)
      .then(loop)
      .catch(resolver.reject);
  };
  loop();
  // process.nextTick(loop);
  return resolver.promise;
};
let registrationOpen = false;
const event_url =
  "https://www.eventbrite.com/e/2018-womens-climbing-festival-bishop-registration-40946620444";
const sign_in_url = "https://www.eventbrite.com/signin/";
const signIn = function() {
  // sign in snippet
  return nightmare
    .goto(sign_in_url)
    .insert("#signin-email", sign_in_info.email)
    .click('*[data-automation="signup-submit-button"]')
    .wait("input[type=password]")
    .insert("input[type=password]", sign_in_info.pw)
    .click('*[data-automation="signup-submit-button"]')
    .wait("#content");
};
let foundSelectBox;
const checkForUpdate = function() {
  const selector =
    '*[data-automation="order-box-ticket-list-container"]>ul>li:nth-child(2)>div>div>div>div>select';
  const alternateSelector =
    '*[data-automation="order-box-ticket-list-container"]>ul>li:nth-child(2)>div>div>div>select';
  // Select ticket snippet
  return nightmare
    .goto(event_url + "#tickets")
    .refresh()
    .wait('*[data-automation="order-box-ticket-list-container"]')
    .evaluate(
      function(params) {
        var selector = params.selector;
        var alternateSelector = params.alternateSelector;
        if (document.querySelector(selector)) {
          return { open: true, selector: selector };
          console.log("registration open");
        }
        if (document.querySelector(alternateSelector)) {
          return { open: true, selector: alternateSelector, alt: true };
          console.log("registration alternate selector");
        }
        console.log("registration closed");
        return { open: false, selector: selector };
      },
      { selector, alternateSelector }
    )
    .then(result => {
      console.log(result);
      registrationOpen = result.open;
      foundSelectBox = result.selector;
    });
};

const checkOut = function() {
  return nightmare
    .wait('*[data-automation="dialog-content"]')
    .select(foundSelectBox, "2")
    .click('*[data-automation="ticket-modal-register-button"]')
    .wait("#registrationDiv")
    .select("#payment_method_select", sign_in_info.payment_method)
    .click('data-automation="pay-button"')
    .end();
};

const runScraper = function() {
  return signIn()
    .then(() => {
      return promiseWhile(() => {
        console.log("reg check", registrationOpen);
        return !registrationOpen;
      }, checkForUpdate);
    })
    .then(checkOut);
};

runScraper().catch(e => {
  console.log("scraper error");
  console.error(e);
});
