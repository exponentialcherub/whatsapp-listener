const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const queueDomain = 'http://localhost:5001'
const fplQueueUrl = queueDomain + '/publish/fpl'
const whatsAppQueueUrl = queueDomain + '/consume/whatsapp'
const notifyQueueUrl = queueDomain + '/consume/notify'

const messageFrom = {
  'test': '447446909348-1635533919@g.us', // MEEEEEEEE
  'prod': '447951286325-1619878176@g.us' // FC Bathelona
}

function getEnv() {
  if(!process.argv[2]) {
    throw new Error('Please provide valid environment. Example usage: node index.js test')
  }
  return process.argv[2]
}

function getMessageFrom() {
  const env = getEnv()
  const messageFromId = messageFrom[env]
  if(!messageFromId) {
    throw new Error('Could not identify chat to listen to in env: ' + env)
  }
  return messageFromId
}

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

async function getMessage(queueUrl) {
  try {
    const response = await fetch(queueUrl)
    
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

function isValidMsg(msg) {
  const messageFromId = getMessageFrom()
  return (msg.from == messageFromId || msg.to == messageFromId) && msg.body.startsWith('!')
}

async function pollForNotifications() {
  while(true) {
    await sleep(30000)
    
    reply = await getMessage(notifyQueueUrl)
    
    if(reply['status'] == 'empty') {
      continue
    }
    
    client.sendMessage(getMessageFrom(), reply['message'])
    return
  }
}

const client = new Client(
  {  
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        executablePath: '/bin/chromium'
      },
      authStrategy: new LocalAuth({clientId: "whatsapp-client-" + getEnv() })
  }
);

client.on('qr', (qr) => {
    console.log('QR Code received');
    console.log(qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');

    pollForNotifications();
});

// message_create to listen to my own messages - this causes a recursive trigger. Check for '!' and return early.
client.on('message_create', async msg => {
    if(!isValidMsg(msg)) {
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
      
      reply = await getMessage(whatsAppQueueUrl)
      
      if(reply['status'] == 'empty') {
        continue
      }
      
      msg.reply(reply['message'])
      return
    }
});

client.initialize();
