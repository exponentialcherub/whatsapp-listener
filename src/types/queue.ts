export interface QueueResponse {
  status: string;
  message?: string;
}

export interface PostMessagePayload {
  action: string;
  reply_to: string;
}
