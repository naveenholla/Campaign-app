
3. Enter a description of your marketing campaign in the input field and click Send to generate both email content and a matching image.

## Features

- Generates professional marketing emails with structured content
- Creates matching campaign images
- Real-time generation with loading states
- Error handling and fallback images
- Ability to regenerate content separately

## Environment Variables

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_REGION`: AWS region where Bedrock is available (e.g., "us-east-1")

## Troubleshooting

1. If you see "Invalid model identifier":
   - Verify model access is enabled in AWS Bedrock console
   - Check that your AWS credentials have proper permissions

2. If image generation fails:
   - Verify Titan Image Generator model access
   - Check AWS region configuration
   - Ensure AWS credentials have necessary permissions


## Available Models

To get a list of available foundation models in your region:

```bash
# List models and save to JSON
aws bedrock list-foundation-models --region us-east-1 > bedrock-models.json

# Or with pretty formatting (requires jq):
aws bedrock list-foundation-models --region us-east-1 | jq '.' > bedrock-models.json
```

This will help you verify which models are available in your account and region.

## License

[Your chosen license]