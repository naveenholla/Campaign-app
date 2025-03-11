import { getCredentials } from './aws-credentials';
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Credentials } from "@aws-sdk/types";

interface AwsConfig {
  credentials: Credentials | null;
  region: string;
}

// Default config with null credentials - will be updated after async initialization
export const awsConfig: AwsConfig = {
  credentials: null,
  region: process.env.AWS_REGION || 'us-east-1', // Default to us-east-1 if not specified
};

// Async function to get credentials
export const getAwsConfig = async (): Promise<AwsConfig> => {
  const credentials = await getCredentials();
  
  return {
    credentials,
    region: process.env.AWS_REGION || 'us-east-1', // Default to us-east-1 if not specified
  };
};

// Initialize the config
getAwsConfig().then(config => {
  awsConfig.credentials = config.credentials;
  awsConfig.region = config.region;
}).catch(error => {
  console.error('Failed to initialize AWS config:', error);
}); 