import { getEnv, loadConfig } from './load';

export const config = loadConfig();
export const env = getEnv();
