import { Credentials } from "@aws-sdk/types";
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const result = config({ path: path.resolve(process.cwd(), '.env.local') });

if (result.error) {
  throw new Error('Failed to load .env.local file');
}

// Store the parsed .env.local values
const envLocal = result.parsed || {};

export function getCredentials(): Credentials {
  const accessKeyId = envLocal.AWS_ACCESS_KEY_ID;
  const secretAccessKey = envLocal.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found in .env.local');
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
} 