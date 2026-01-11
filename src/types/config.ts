import { z } from 'zod';

/**
 * Channel
 */
export const ChannelSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  maxReplies: z.number().int().positive().max(50).optional(),
});

/**
 * Channels
 */
export const ChannelsSchema = z.object({
  receive: z.array(ChannelSchema).min(1),
  notify: z.array(ChannelSchema).min(1),
});

/**
 * Poller
 */
export const PollerSchema = z.object({
  notification_interval: z.number().int().positive().min(30000),
  reply_interval: z.number().int().positive().min(100).max(1000),
  max_reply_attempts: z.number().int().positive().min(1).max(20),
});

/**
 * Root Config
 */
export const ConfigSchema = z.object({
  channels: ChannelsSchema,
  queue_domain: z.string().min(1),
  poller: PollerSchema,
});

export type Channel = z.infer<typeof ChannelSchema>;

export type Config = z.infer<typeof ConfigSchema>;
