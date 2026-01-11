import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { postMessage } from './queue/queue';
import * as WAWebJS from 'whatsapp-web.js';
import { startNotificationPoller, SendMessageFn } from './polling/notificationPoller';
import { pollForReplies } from './polling/replyPoller';
import { config, env } from './config/index';
import { Channel } from './types/config';

type Message = WAWebJS.Message;

const whatsAppQueue: string = 'whatsapp';

const client = new Client(
  {  
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      executablePath: '/bin/chromium'
    },
    authStrategy: new LocalAuth({clientId: "whatsapp-client-" + env })
  }
);

function isValidMsg(msg: Message): boolean {
  return typeof msg.body === 'string' && msg.body.startsWith('!');
}

client.on('qr', (qr: string) => {
    console.log('QR Code received');
    console.log(qr);
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');

    // Create sendMessage wrapper function that decouples poller from WhatsApp client
    const sendMessage: SendMessageFn = async (target: string, message: string) => {
      await client.sendMessage(target, message);
    };

    startNotificationPoller(sendMessage);
});

// message_create to listen to my own messages - this causes a recursive trigger. Check for '!' and return early.
client.on('message_create', async (msg: Message) => {
  try {
    if (!isValidMsg(msg)) {
      return;
    }

    if (msg.body === '!ping') {
      try {
        await msg.reply('pong');
      } catch (error) {
        const err = error as Error;
        console.error('Error replying to ping:', err.message);
      }
      return;
    }

    const channel: Channel | undefined = config.channels.receive.find((channel: Channel) => {
      const source: string = channel.source;
      return msg.from === source || msg.to === source;
    });

    if (!channel) {
      console.log("no channel for source " + msg.from);
      return;
    }

    console.log("Posted message '" + msg.body + "' to" + channel.target);
    await postMessage(msg.body, channel.target, whatsAppQueue);

    // Poll for replies with injected dependencies
    const replies: string[] = await pollForReplies(whatsAppQueue, channel.maxReplies || 1);

    for (const reply of replies) {
      try {
        await msg.reply(reply);
      } catch (error) {
        const err = error as Error;
        console.error('Error replying to message:', err.message);
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error('Error processing message:', err.message);
  }
});

client.on('disconnected', (reason: string) => {
    console.log('Client was disconnected:', reason);
});

client.on('auth_failure', (msg: string) => {
    console.error('Authentication failure:', msg);
});

client.initialize();
