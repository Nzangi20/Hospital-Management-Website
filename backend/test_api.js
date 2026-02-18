const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors/specializations',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Body:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
