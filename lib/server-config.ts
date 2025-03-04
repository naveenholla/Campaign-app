import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const result = config({ path: path.resolve(process.cwd(), '.env.local') })

if (result.error) {
  throw new Error('Failed to load .env.local file');
}

// Store the parsed .env.local values
const envLocal = result.parsed || {};

// Create AWS configuration
export const awsConfig = {
  accessKeyId: envLocal.AWS_ACCESS_KEY_ID,
  secretAccessKey: envLocal.AWS_SECRET_ACCESS_KEY,
  region: envLocal.AWS_REGION,
};

// Log the configuration (without sensitive data)
console.log('Server AWS Configuration loaded from .env.local:', {
  accessKeyId: awsConfig.accessKeyId,
  region: awsConfig.region,
}); 