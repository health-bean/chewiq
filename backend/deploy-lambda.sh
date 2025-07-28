#!/bin/bash

# Deploy Lambda function script
echo "🚀 Deploying Lambda function..."

# Navigate to the API directory
cd functions/api

# Copy the connection manager from the main backend directory (single source of truth)
echo "📋 Copying connection manager from main backend..."
cp ../../database/connection-manager.js database/connection-manager.js

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../api.zip . -x "*.DS_Store" "node_modules/.cache/*"

# Clean up the copied file (keep single source of truth)
echo "🧹 Cleaning up copied connection manager..."
rm database/connection-manager.js

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
