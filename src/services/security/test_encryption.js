const CryptoJS = require('crypto-js');

function testEncryption() {
  const pin = "123456";
  const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  try {
    console.log("Starting encryption test...");
    
    // Mocking random if not present (to see if it works in this environment)
    if (!CryptoJS.lib.WordArray.random) {
      console.log("CryptoJS.lib.WordArray.random is missing!");
    }

    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    console.log("Salt generated:", salt.toString());

    const key = CryptoJS.PBKDF2(pin, salt, {
      keySize: 256 / 32,
      iterations: 1000, // Reduced for speed in test
    });
    console.log("Key derived.");

    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    console.log("IV generated:", iv.toString());

    const encrypted = CryptoJS.AES.encrypt(privateKey, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    console.log("Encrypted string length:", encrypted.toString().length);

    const payload = {
      ciphertext: encrypted.toString(),
      iv: iv.toString(),
      salt: salt.toString(),
    };

    const encryptedPayload = JSON.stringify(payload);
    console.log("Payload created.");

    // Test Decryption
    const decryptedPayload = JSON.parse(encryptedPayload);
    const dSalt = CryptoJS.enc.Hex.parse(decryptedPayload.salt);
    const dIv = CryptoJS.enc.Hex.parse(decryptedPayload.iv);

    const dKey = CryptoJS.PBKDF2(pin, dSalt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const decrypted = CryptoJS.AES.decrypt(decryptedPayload.ciphertext, dKey, {
      iv: dIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    console.log("Decrypted plaintext matches:", plaintext === privateKey);

  } catch (error) {
    console.error("Encryption test failed:", error);
  }
}

testEncryption();
