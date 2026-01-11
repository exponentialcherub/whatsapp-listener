import { config } from '../config';
import { getMessage } from '../queue/queue';
import { sleep } from '../utils/sleep';

export type SendMessageFn = (target: string, message: string) => Promise<void>;

export function startNotificationPoller(sendMessage: SendMessageFn): void {
  const pollInterval = config.poller.notification_interval;
  const notifyChannels = config.channels.notify;
  const queueDomain = config.queue_domain;

  async function pollForNotifications(): Promise<void> {
    while(true) {
      await sleep(pollInterval);
      
      for (const notifyChannel of notifyChannels) {
        const reply = await getMessage(notifyChannel.source);
        
        if(reply && reply.status === 'empty') {
          continue;
        }

        if (reply && reply.message) {
          try {
            await sendMessage(notifyChannel.target, reply.message);
          } catch (error) {
            const err = error as Error;
            console.error('Error sending notification:', err.message);
          }
        }
      }
    }
  }

  console.log('Starting notification poller');
  console.log('Notify channels:', notifyChannels);
  console.log('Queue domain:', queueDomain);
  console.log('Poll interval (ms):', pollInterval);

  pollForNotifications().catch((error: Error) => {
    console.error('Error in notification polling:', error.message);
  });
}
