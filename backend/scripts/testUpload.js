const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Login pour obtenir un token
const loginData = JSON.stringify({
  email: 'test-i18n@test.com',
  password: 'Test1234!'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.token) {
      console.log('LOGIN OK - Token obtenu');
      testUpload(result.token);
    } else {
      console.log('LOGIN ERREUR:', data);
    }
  });
});
loginReq.write(loginData);
loginReq.end();

// 2. Créer une image test (1x1 pixel PNG)
function createTestImage() {
  // PNG 1x1 pixel rouge minimal
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
    0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return pngBuffer;
}

// 3. Tester upload multipart/form-data
function testUpload(token) {
  const imageBuffer = createTestImage();
  const boundary = '----TestBoundary123456';

  // Construire le body multipart
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="photo"; filename="test-photo.png"\r\n`;
  body += `Content-Type: image/png\r\n\r\n`;

  const bodyStart = Buffer.from(body, 'utf8');
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([bodyStart, imageBuffer, bodyEnd]);

  const uploadReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/photos',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\nUPLOAD TEST - Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('Resultat:', JSON.stringify(result, null, 2));

        if (result.photo) {
          console.log('\n--- TEST UPLOAD PHOTO: PASSE ---');
          console.log(`Photo URL: ${result.photo.url}`);
          console.log(`Photo ID: ${result.photo._id}`);
          console.log(`isPrimary: ${result.photo.isPrimary}`);

          // Test suppression
          testDeletePhoto(token, result.photo._id);
        }
      } catch (e) {
        console.log('Reponse brute:', data);
      }
    });
  });
  uploadReq.write(fullBody);
  uploadReq.end();
}

// 4. Tester suppression photo
function testDeletePhoto(token, photoId) {
  const deleteReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/users/photos/${photoId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\nDELETE TEST - Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('Resultat:', JSON.stringify(result, null, 2));
        if (res.statusCode === 200) {
          console.log('\n--- TEST SUPPRESSION PHOTO: PASSE ---');
        }
      } catch (e) {
        console.log('Reponse brute:', data);
      }

      // Test upload multiple (6 max)
      testUploadLimit(token);
    });
  });
  deleteReq.end();
}

// 5. Tester la limite de 6 photos
function testUploadLimit(token) {
  console.log('\n--- TEST LIMITE 6 PHOTOS ---');
  let uploaded = 0;

  function uploadOne(n) {
    const imageBuffer = createTestImage();
    const boundary = '----TestBoundary' + n;
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="photo"; filename="test-${n}.png"\r\n`;
    body += `Content-Type: image/png\r\n\r\n`;
    const bodyStart = Buffer.from(body, 'utf8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const fullBody = Buffer.concat([bodyStart, imageBuffer, bodyEnd]);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/photos',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        uploaded++;
        console.log(`Photo ${n}: ${res.statusCode} - ${result.photo ? 'OK (isPrimary: ' + result.photo.isPrimary + ')' : result.error}`);

        if (n < 7) {
          uploadOne(n + 1);
        } else {
          console.log(`\nPhotos uploadees: ${uploaded - 1}/7 (attendu: 6 OK + 1 erreur)`);
          if (result.error) {
            console.log('--- TEST LIMITE 6 PHOTOS: PASSE ---');
          } else {
            console.log('--- TEST LIMITE 6 PHOTOS: ECHOUE (7eme photo acceptee) ---');
          }

          // Tester photo principale
          testSetPrimary(token);
        }
      });
    });
    req.write(fullBody);
    req.end();
  }

  uploadOne(1);
}

// 6. Tester changement photo principale
function testSetPrimary(token) {
  const getReq = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const user = JSON.parse(data);
      if (user.photos && user.photos.length >= 2) {
        const secondPhoto = user.photos[1];
        console.log(`\nTEST SET PRIMARY - Photo ID: ${secondPhoto._id}`);

        const patchReq = http.request({
          hostname: 'localhost',
          port: 5000,
          path: `/api/users/photos/${secondPhoto._id}/primary`,
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        }, (res2) => {
          let data2 = '';
          res2.on('data', chunk => data2 += chunk);
          res2.on('end', () => {
            console.log(`SET PRIMARY - Status: ${res2.statusCode}`);
            const result = JSON.parse(data2);
            if (result.photos) {
              const primary = result.photos.find(p => p.isPrimary);
              console.log(`Nouvelle photo principale: ${primary._id}`);
              if (primary._id === secondPhoto._id) {
                console.log('--- TEST SET PRIMARY: PASSE ---');
              } else {
                console.log('--- TEST SET PRIMARY: ECHOUE ---');
              }
            }
            console.log('\n=== TOUS LES TESTS PHOTO TERMINES ===');
          });
        });
        patchReq.end();
      } else {
        console.log('Pas assez de photos pour tester setPrimary');
        console.log('\n=== TOUS LES TESTS PHOTO TERMINES ===');
      }
    });
  });
  getReq.end();
}
