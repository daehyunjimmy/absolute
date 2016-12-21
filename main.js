/* eslint-env browser, es6 */
//python -m http.server [port]

'use strict';

const pushButton = document.querySelector('.js-push-btn');
const sendPushButton = document.querySelector('.js-send-push-btn');

let isSubscribed = false;
function updateButton() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}

function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server

  console.log('updateSubscriptionOnServer');
  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails =
    document.querySelector('.js-subscription-details');

  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

function initialiseButton() {
  pushButton.addEventListener('click', function() {
    if (isSubscribed) {
      unsubscribeUser();
	  updateSubscriptionOnServer(null);
    } else {
      var promiseSubscipt = function() {
        return new Promise(function() {
          subscribeUser();
        });
      };
	  promiseSubscipt().then(function(){
		updateSubscriptionOnServer(getSubscription());
	  }, function(error) {
		console.log(error);
	  });
	}
	isSubscribed = !isSubscribed;
	updateButton();
  });

  sendPushButton.addEventListener('click', function() {
    sendPushMessage();
  });
}
registerServiceWorker();
initialiseButton();
