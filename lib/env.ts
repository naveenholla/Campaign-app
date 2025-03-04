import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const result = config({ path: path.resolve(process.cwd(), '.env.local') })

if (result.error) {
  throw new Error('Failed to load .env.local file');
}

// Log which .env file was loaded
console.log('Loaded environment from:', result.parsed ? '.env.local' : 'system environment');

// Store the parsed .env.local values
const envLocal = result.parsed || {};

export function getRequiredEnvVar(name: string): string {
  // First try to get from .env.local
  const value = envLocal[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} in .env.local`);
  }
  return value;
}

// Create AWS credentials object using .env.local values
export const awsConfig = {
  accessKeyId: getRequiredEnvVar('AWS_ACCESS_KEY_ID'),
  secretAccessKey: getRequiredEnvVar('AWS_SECRET_ACCESS_KEY'),
  region: getRequiredEnvVar('AWS_REGION'),
};

// Log the configuration (without sensitive data)
console.log('AWS Configuration loaded from .env.local:', {
  accessKeyId: awsConfig.accessKeyId,
  region: awsConfig.region,
  secretAccessKey: awsConfig.secretAccessKey,
}); 