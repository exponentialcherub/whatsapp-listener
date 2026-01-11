import { config } from "../config";
import { QueueResponse, PostMessagePayload } from "../types/queue";

const queueDomain: string = config.queue_domain;
const publishUrl: string = queueDomain + '/publish';
const consumeUrl: string = queueDomain + '/consume';

export const postMessage = async (
  action: string, 
  target: string, 
  reply_to: string
): Promise<QueueResponse> => {
    try {
        const payload: PostMessagePayload = { action, reply_to };
        const response = await fetch(`${publishUrl}/${target}`, { 
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload) 
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as QueueResponse;
        console.log(result)
        return result
    } catch (error) {
        const err = error as Error;
        console.error('Error posting message:', err.message)
        throw error
    }
}

export const getMessage = async (source: string): Promise<QueueResponse> => {
    try {
        const response = await fetch(`${consumeUrl}/${source}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as QueueResponse;
        console.log(result)
        return result
    } catch (error) {
        const err = error as Error;
        console.error('Error getting message:', err.message)
        // Return empty status to allow polling to continue
        return { status: 'empty' }
    }
}
