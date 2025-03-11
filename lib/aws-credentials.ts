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
      console.log('Using AWS IAM role credentials');
      return credentials;
    }
    return null;
  } catch (error) {
    console.log('No IAM role credentials available');
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

  throw new Error('No valid AWS credentials found from either IAM role or .env.local');
} 