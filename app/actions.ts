"use server"

import { generateText } from "ai"
import { bedrock } from "@ai-sdk/amazon-bedrock"
import { signBedrockRequest } from "@/lib/aws-bedrock"

const bedrockTextModel = bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0")

export async function generateEmailContent(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: bedrockTextModel,
    system: `You are an expert marketing copywriter specializing in email campaigns. 
    Create professional, engaging marketing emails with the following structure:
    - A catchy subject line (prefixed with "Subject:")
    - An engaging opening paragraph
    - A body highlighting key points or benefits
    - A clear call to action
    - A brief closing remark
    
    Format the email with proper spacing between sections. Be persuasive, professional, and tailored to the target audience.`,
    prompt: `Create a marketing email for: ${prompt}`,
  })

  return text
}

export async function generateMarketingImage(prompt: string): Promise<string> {
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
      "https://bedrock-runtime.us-east-1.amazonaws.com/model/amazon.titan-image-generator-v2:0/invoke",
      body,
      process.env.AWS_REGION!,
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

    console.log('Bedrock Image API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bedrock Image API Error Response:', errorText);
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

