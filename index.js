const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const fplQueueUrl = 'http://localhost:5001/publish/fpl'
const whatsAppQueue = 'whatsapp'
const whatsAppQueueUrl = 'http://localhost:5001/consume/' + whatsAppQueue

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

async function getMessage() {
  try {
    const response = await fetch(whatsAppQueueUrl)
    
    if(!response.ok) {
      throw new Error(response.status)
    }
    
    const result = await response.json()
    console.log(result)
    return result
  } catch (error) {
    console.error(error.message)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

// message_create to listen to my own messages - this causes a recursive trigger. Check for '!' and return early.
client.on('message_create', async msg => {
    if(!msg.body.startsWith('!')) {
        return
    }
    if (msg.body == '!ping') {
        msg.reply('pong')
        return
    }
    
    await postMessage(msg.body)
      
    var tries = 0
    while(++tries < 20) {
      await sleep(100)
      
      reply = await getMessage()
      
      if(reply['status'] == 'empty') {
        continue
      }
      
      msg.reply(reply['message'])
      return
    }
});

client.initialize();
