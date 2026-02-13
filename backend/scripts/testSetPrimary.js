const http = require('http');
const loginData = JSON.stringify({email:'test-i18n@test.com',password:'Test1234!'});

const req = http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json'}}, res => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
    const token = JSON.parse(d).token;
    const getReq = http.request({hostname:'localhost',port:5000,path:'/api/users/me',method:'GET',headers:{'Authorization':'Bearer '+token}}, r2 => {
      let d2=''; r2.on('data',c=>d2+=c); r2.on('end',()=>{
        const resp = JSON.parse(d2);
        const photos = resp.user ? resp.user.photos : resp.photos;
        console.log('Photos:', photos.length);
        photos.forEach(p => console.log(' -', p._id, p.isPrimary ? 'PRIMARY' : ''));
        if (photos.length >= 2) {
          const target = photos.find(p => p.isPrimary === false);
          console.log('\nSetting primary to:', target._id);
          const patchReq = http.request({hostname:'localhost',port:5000,path:'/api/users/photos/'+target._id+'/primary',method:'PATCH',headers:{'Authorization':'Bearer '+token}}, r3 => {
            let d3=''; r3.on('data',c=>d3+=c); r3.on('end',()=>{
              console.log('Status:', r3.statusCode);
              const result = JSON.parse(d3);
              const rPhotos = result.photos || [];
              rPhotos.forEach(p => console.log(' -', p._id, p.isPrimary ? 'PRIMARY' : ''));
              const newPrimary = rPhotos.find(p => p.isPrimary);
              if (newPrimary && newPrimary._id === target._id) {
                console.log('--- TEST SET PRIMARY: PASSE ---');
              } else {
                console.log('--- TEST SET PRIMARY: ECHOUE ---');
              }
            });
          });
          patchReq.end();
        } else {
          console.log('Pas assez de photos (besoin >= 2)');
        }
      });
    });
    getReq.end();
  });
});
req.write(loginData);
req.end();
