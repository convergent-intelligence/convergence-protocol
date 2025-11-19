// Simple test to check if the website is running

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    if (res.statusCode === 200) {
        console.log('Website is running');
    } else {
        console.error('Website is not running');
        process.exit(1);
    }
});

req.on('error', (error) => {
    console.error(error);
    process.exit(1);
});

req.end();
