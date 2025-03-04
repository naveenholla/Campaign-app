import { SignatureV4 } from "@aws-sdk/signature-v4"
import { Sha256 } from "@aws-crypto/sha256-js"
import { awsConfig } from "./server-config"

// Helper function to sign AWS requests
export async function signBedrockRequest(url: string, body: any, region: string) {
  const endpoint = new URL(url)

  const signer = new SignatureV4({
    credentials: {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    },
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

