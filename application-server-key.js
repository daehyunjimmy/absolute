/* eslint-env browser, es6 */

function base64UrlToUint8Array(base64UrlData) {
  const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
  const base64 = (base64UrlData + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

function uint8ArrayToBase64Url(uint8Array, start, end) {
  start = start || 0;
  end = end || uint8Array.byteLength;

  const base64 = window.btoa(
    String.fromCharCode.apply(null, uint8Array.subarray(start, end)));
  return base64
    .replace(/\=/g, '') // eslint-disable-line no-useless-escape
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function cryptoKeyToUrlBase64(publicKey, privateKey) {
  const promises = [];
  promises.push(
    crypto.subtle.exportKey('jwk', publicKey)
    .then((jwk) => {
      const x = base64UrlToUint8Array(jwk.x);
      const y = base64UrlToUint8Array(jwk.y);

      const publicKey = new Uint8Array(65);
      publicKey.set([0x04], 0);
      publicKey.set(x, 1);
      publicKey.set(y, 33);

	  console.log(publicKey);

      return publicKey;
    })
  );

  promises.push(
    crypto.subtle
      .exportKey('jwk', privateKey)
    .then((jwk) => {
      return base64UrlToUint8Array(jwk.d);
    })
  );

  return Promise.all(promises)
  .then((exportedKeys) => {
    return {
      public: uint8ArrayToBase64Url(exportedKeys[0]),
      private: uint8ArrayToBase64Url(exportedKeys[1]),
    };
  });
}

function generateNewKeys() {
  return crypto.subtle.generateKey({name: 'ECDH', namedCurve: 'P-256'},
    true, ['deriveBits'])
  .then((keys) => {
    return cryptoKeyToUrlBase64(keys.publicKey, keys.privateKey);
  });
}

function updateKeys() {
  let storedKeys = getStoredKeys();
  let promiseChain = Promise.resolve(storedKeys);
  if (!storedKeys) {
    promiseChain = generateNewKeys()
    .then((newKeys) => {
      storeKeys(newKeys);
	  console.log('updateKeys keys = ' + newKeys.public);
      return newKeys;
    });
  }

  return promiseChain.then((keys) => {
    console.log('updateKeys return stored key');
  });
}

function clearKeys() {
  window.localStorage.removeItem('server-keys');
}

function storeKeys(keys) {
  window.localStorage.setItem('server-keys', JSON.stringify(keys));
}

function getStoredKeys() {
  const storage = window.localStorage.getItem('server-keys');
  if (storage) {
  	console.log(JSON.parse(storage));
    return JSON.parse(storage);
  }

  return null;
}

function sendPushMessage() {
  var keyObject = getStoredKeys();
  var publicKey = keyObject.public;
  var privateKey = keyObject.private; 
  return fetch('sw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription: keyObject,
      applicationKeys: {
        public: publicKey,
        private: privateKey,
      }
    })
  })
  .then((response) => {
    if (response.status !== 200) {
      return response.text()
      .then((responseText) => {
        throw new Error(responseText);
      });
    }
  });
}

window.addEventListener('load', () => {
});