const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client(
  {  
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        executablePath: '/bin/chromium'
      }
  }
);

client.on('qr', (qr) => {
    console.log('QR Code received');
    console.log(qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
