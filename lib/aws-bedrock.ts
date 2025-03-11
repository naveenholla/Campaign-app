import { SignatureV4 } from "@aws-sdk/signature-v4"
import { Sha256 } from "@aws-crypto/sha256-js"
import { awsConfig, getAwsConfig } from "./aws-config"

// List of Bedrock models that don't support system prompts
const noSystemPromptModels = [
  "amazon.titan-text-express-v1",
  "amazon.titan-text-lite-v1",
  "cohere.command-text-v14",
  "cohere.command-light-text-v14",
];

// Helper function to check if a model supports system prompts
export function supportsSystemPrompts(modelId: string): boolean {
  return !noSystemPromptModels.includes(modelId);
}

// Helper function to sign AWS requests
export async function signBedrockRequest(url: string, body: any, region: string) {
  const endpoint = new URL(url)
  
  // If credentials are not yet initialized in awsConfig, get them async
  if (!awsConfig.credentials) {
    const config = await getAwsConfig();
    awsConfig.credentials = config.credentials;
    awsConfig.region = config.region;
  }

  // Ensure we have valid credentials
  if (!awsConfig.credentials) {
    throw new Error('Failed to obtain AWS credentials');
  }

  // Handle models that don't support system prompts
  if (body.messages && Array.isArray(body.messages)) {
    const modelId = body.modelId || '';
    if (!supportsSystemPrompts(modelId)) {
      // Convert system messages to user/assistant pairs
      body.messages = body.messages.reduce((acc: any[], message: any) => {
        if (message.role === 'system') {
          // Convert system message to a user/assistant pair
          acc.push({
            role: 'user',
            content: message.content
          });
          acc.push({
            role: 'assistant',
            content: 'Understood.'
          });
        } else {
          acc.push(message);
        }
        return acc;
      }, []);
    }
  }

  const signer = new SignatureV4({
    credentials: awsConfig.credentials,
    region: awsConfig.region,
    service: "bedrock",
    sha256: Sha256,
  })

  const signedRequest = await signer.sign({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: endpoint.host,
    },
    hostname: endpoint.host,
    path: endpoint.pathname,
    protocol: endpoint.protocol.replace(':', ''),
    body: JSON.stringify(body),
  });

  return signedRequest
}

