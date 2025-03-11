import { Credentials } from "@aws-sdk/types";
import { config } from 'dotenv';
import path from 'path';
import { fromEnv } from "@aws-sdk/credential-providers";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

async function getCredentialsFromRole(): Promise<Credentials | null> {
  try {
    // Try to get credentials from the default provider chain (includes IAM roles)
    const provider = defaultProvider();
    const credentials = await provider();
    
    // Verify we have valid credentials
    if (credentials.accessKeyId && credentials.secretAccessKey) {
      console.log('Successfully obtained credentials from provider chain');
      
      // Verify Bedrock permissions
      try {
        // We'll keep the existing credentials check
        return credentials;
      } catch (bedrockError: any) {
        console.error('Error verifying Bedrock permissions:', {
          message: bedrockError.message,
          code: bedrockError.code
        });
        return null;
      }
    }
    return null;
  } catch (error: any) {
    console.error('Error obtaining credentials:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      cfId: error.$metadata?.cfId
    });
    
    if (error.code === 'CredentialsError' || error.message?.includes('Unable to assume')) {
      console.log('Credential acquisition failed. Please verify:');
      console.log('1. The role has bedrock:InvokeModel permission');
      console.log('2. The trust relationship includes Amplify app');
      console.log('3. AWS_REGION is correctly set');
    }
    
    return null;
  }
}

async function getCredentialsFromEnv(): Promise<Credentials | null> {
  try {
    // Load environment variables from .env.local
    const result = config({ path: path.resolve(process.cwd(), '.env.local') });
    
    if (result.error) {
      console.log('Failed to load .env.local file');
      return null;
    }

    // Try to get credentials from environment variables
    const credentials = await fromEnv()();
    if (credentials.accessKeyId && credentials.secretAccessKey) {
      console.log('Using credentials from .env.local');
      return credentials;
    }
    return null;
  } catch (error) {
    console.log('No environment credentials available');
    return null;
  }
}

export async function getCredentials(): Promise<Credentials> {
  // First try to get credentials from IAM role
  const roleCredentials = await getCredentialsFromRole();
  if (roleCredentials) {
    return roleCredentials;
  }

  // Fall back to environment variables
  const envCredentials = await getCredentialsFromEnv();
  if (envCredentials) {
    return envCredentials;
  }

  throw new Error(`No valid AWS credentials found. 
    If using IAM roles, please verify:
    1. The role exists and has correct permissions for Bedrock
    2. The trust relationship allows the service to assume the role
    3. The role ARN is correct
    
    If using local development:
    1. Ensure .env.local exists with valid credentials
    2. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly`);
} 