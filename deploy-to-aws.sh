#!/bin/bash
set -e

echo "🚀 MWTSI Address Intelligence - AWS Deployment Script"
echo "===================================================="
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO_NAME="address-intelligence"
DOCKER_IMAGE_TAG="latest"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "📋 Configuration:"
echo "   Region: $AWS_REGION"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   ECR Registry: $ECR_REGISTRY"
echo ""

# Step 1: Create ECR Repository
echo "1️⃣  Creating ECR Repository..."
if aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION 2>/dev/null; then
    echo "   ✓ Repository already exists"
else
    echo "   Creating new repository..."
    aws ecr create-repository \
        --repository-name $ECR_REPO_NAME \
        --region $AWS_REGION \
        --encryption-configuration encryptionType=AES \
        --image-tag-mutability MUTABLE \
        --image-scanning-configuration scanOnPush=true
    echo "   ✓ Repository created"
fi
echo ""

# Step 2: Authenticate Docker
echo "2️⃣  Authenticating Docker with ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_REGISTRY
echo "   ✓ Docker authenticated"
echo ""

# Step 3: Build Docker Image
echo "3️⃣  Building Docker Image..."
docker build -t $ECR_REPO_NAME:$DOCKER_IMAGE_TAG .
echo "   ✓ Image built: $ECR_REPO_NAME:$DOCKER_IMAGE_TAG"
echo ""

# Step 4: Tag Image for ECR
echo "4️⃣  Tagging image for ECR..."
docker tag $ECR_REPO_NAME:$DOCKER_IMAGE_TAG \
    $ECR_REGISTRY/$ECR_REPO_NAME:$DOCKER_IMAGE_TAG
echo "   ✓ Tagged: $ECR_REGISTRY/$ECR_REPO_NAME:$DOCKER_IMAGE_TAG"
echo ""

# Step 5: Push to ECR
echo "5️⃣  Pushing image to ECR..."
docker push $ECR_REGISTRY/$ECR_REPO_NAME:$DOCKER_IMAGE_TAG
echo "   ✓ Image pushed successfully"
echo ""

# Step 6: Create App Runner Service (if chosen)
read -p "6️⃣  Deploy to App Runner? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Creating App Runner service..."
    
    SERVICE_NAME="address-intelligence"
    
    # Check if service exists
    if aws apprunner describe-service --service-arn arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$SERVICE_NAME 2>/dev/null; then
        echo "   ⚠️  Service already exists. Skipping creation."
        echo "   To update: AWS Console → App Runner → address-intelligence → Deploy"
    else
        echo "   ⚠️  Please create the App Runner service manually:"
        echo "   1. Go to AWS App Runner console"
        echo "   2. Click 'Create service'"
        echo "   3. Select 'Container registry'"
        echo "   4. Repository: $ECR_REGISTRY/$ECR_REPO_NAME"
        echo "   5. Image tag: $DOCKER_IMAGE_TAG"
        echo "   6. Configure environment variables from .env.aws.example"
        echo "   7. Set up EFS storage mount at /data"
    fi
fi
echo ""

echo "✅ Deployment preparation complete!"
echo ""
echo "📊 Next Steps:"
echo "1. Push code with Dockerfile to your repository"
echo "2. Set up App Runner service with:"
echo "   - ECR image: $ECR_REGISTRY/$ECR_REPO_NAME:$DOCKER_IMAGE_TAG"
echo "   - Port: 3000"
echo "   - Environment: ADDRESS_DB_PATH=/data/address.db"
echo "   - Storage: Mount EFS at /data"
echo "3. Configure custom domain and SSL"
echo "4. Set up CloudWatch monitoring"
echo "5. Configure automated backups"
echo ""
echo "📚 For detailed instructions, see: AWS_DEPLOYMENT.md"
echo ""
