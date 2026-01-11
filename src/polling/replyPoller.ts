import { config } from '../config';
import { getMessage } from '../queue/queue';
import { sleep } from '../utils/sleep';

const pollInterval = config.poller.reply_interval;
const maxAttempts = config.poller.max_reply_attempts;

export async function pollForReplies(
  queue: string,
  maxReplies: number,
): Promise<string[]> {
  let replies: number = 0;
  let attempts: number = 0;
  const messages: string[] = [];
  
  while (++attempts < maxAttempts) {
    await sleep(pollInterval);

    const reply = await getMessage(queue);

    if (!reply || reply.status === 'empty') {
      continue;
    }

    if (reply.message) {
      messages.push(reply.message);
      attempts = 0;
      replies++;
      if (replies >= maxReplies) {
        break;
      }
    }
  }

  return messages;
}
