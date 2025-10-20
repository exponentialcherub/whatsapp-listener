const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const fplQueueUrl = 'http://localhost:5001/publish/fpl'
const whatsAppQueue = 'whatsapp.response'

async function postMessage(action) {
  try {
    const response = await fetch(fplQueueUrl, {method: "POST", body: JSON.stringify({action: action, reply_to: whatsAppQueue})})
    
    if(!response.ok) {
      throw new Error(response.status)
    }
    
    const result = await response.json()
    console.log(result)
  } catch (error) {
    console.error(error.message)
  }
}

async function getMessage() {}

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

client.on('message_create', async msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
    
    if (msg.body.startsWith('!')) {
      await postMessage(msg.body)
    }
    
});

client.initialize();
