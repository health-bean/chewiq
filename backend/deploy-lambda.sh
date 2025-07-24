#!/bin/bash

# Deploy Lambda function script
echo "🚀 Deploying Lambda function..."

# Navigate to the API directory
cd backend/functions/api

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../api.zip . -x "*.DS_Store" "node_modules/.cache/*"

# Update Lambda function
echo "⬆️ Updating Lambda function..."
aws lambda update-function-code \
    --function-name health-platform-dev \
    --zip-file fileb://../api.zip \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Lambda function updated successfully!"
else
    echo "❌ Failed to update Lambda function"
    exit 1
fi

# Clean up
rm ../api.zip
echo "🧹 Cleaned up deployment package"

echo "🎉 Deployment complete!"
