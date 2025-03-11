"use server"

import { generateText } from "ai"
import { bedrock } from "@ai-sdk/amazon-bedrock"
import { signBedrockRequest, supportsSystemPrompts } from "@/lib/aws-bedrock"
import { awsConfig } from "@/lib/aws-config"

export async function generateEmailContent(prompt: string, modelId: string = "amazon.titan-text-lite-v1"): Promise<string> {
  const bedrockTextModel = bedrock(modelId)
  console.log(`Using text model: ${modelId}`)

  const systemPrompt = `You are an expert marketing copywriter specializing in email campaigns. 
  Create professional, engaging marketing emails with the following structure:
  - A catchy subject line (prefixed with "Subject:")
  - An engaging opening paragraph
  - A body highlighting key points or benefits
  - A clear call to action
  - A brief closing remark
  
  Format the email with proper spacing between sections. Be persuasive, professional, and tailored to the target audience.`;

  if (!supportsSystemPrompts(modelId)) {
    // For models that don't support system prompts, combine system and user prompts
    const combinedPrompt = `${systemPrompt}\n\nCreate a marketing email for: ${prompt}`;
    const { text } = await generateText({
      model: bedrockTextModel,
      prompt: combinedPrompt,
    });
    return text;
  }

  // For models that support system prompts
  const { text } = await generateText({
    model: bedrockTextModel,
    system: systemPrompt,
    prompt: `Create a marketing email for: ${prompt}`,
  });

  return text;
}

export async function generateMarketingImage(prompt: string, modelId: string = "amazon.titan-image-generator-v1"): Promise<string> {
  try {
    const body = {
      taskType: 'TEXT_IMAGE',
      textToImageParams: {
        text: `Create a professional marketing image for: ${prompt}. The image should be visually appealing, 
        suitable for an email campaign, and designed to capture attention. It should clearly represent the product 
        or service being marketed.`
      },
      imageGenerationConfig: {
        numberOfImages: 2,
        quality: 'premium',
        cfgScale: 8.0,
        height: 512,
        width: 512,
        seed: Math.floor(Math.random() * 1000000),
      },
    }

    const signedRequest = await signBedrockRequest(
      `https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/invoke`,
      body,
      awsConfig.region
    )

    const url = `https://${signedRequest.hostname}${signedRequest.path}`
    const response = await fetch(url, {
      method: signedRequest.method,
      headers: {
        ...signedRequest.headers,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: signedRequest.body,
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bedrock API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    const base64Image = data.images[0];

    return `data:image/png;base64,${base64Image}`
  } catch (error) {
    console.error("Error generating image with Bedrock:", error)
    return "/placeholder.svg?height=512&width=512"
  }
}

