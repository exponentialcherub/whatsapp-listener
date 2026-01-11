import fs from 'fs';
import path from 'path';
import { merge } from 'lodash';
import { ConfigSchema, Config } from '../types/config';

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadConfig(): Config {
  const env = process.env.NODE_ENV ?? 'dev';

  const baseConfig = readJson(
    path.join(process.cwd(), 'config/default.json')
  );

  const envConfig = readJson(
    path.join(process.cwd(), `config/${env}.json`)
  );

  const merged = merge({}, baseConfig, envConfig);

  return ConfigSchema.parse(merged);
}
