const net = require('net');

const client = new net.Socket();
client.setTimeout(1000);

client.connect(5000, '127.0.0.1', () => {
    console.log('Port 5000 is OPEN');
    client.destroy();
});

client.on('error', (err) => {
    console.log(`Port 5000 is CLOSED or Error: ${err.message}`);
});

client.on('timeout', () => {
    console.log('Port 5000 TIMEOUT');
    client.destroy();
});
