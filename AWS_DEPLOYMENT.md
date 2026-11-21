# AWS Deployment Guide for MWTSI Address Intelligence

## Overview

This guide covers deploying the MWTSI Address Intelligence application to AWS using multiple options. The application requires:
- **Persistent storage** for SQLite database
- **Node.js 22 LTS** runtime
- **Build tools** for native modules (better-sqlite3)

---

## Option 1: AWS App Runner (⭐ Recommended)

**Best for**: Quick deployment, automatic scaling, managed service

### Prerequisites
- AWS Account with appropriate permissions
- Docker image pushed to Amazon ECR
- IAM role for App Runner

### Step 1: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name address-intelligence \
  --region us-east-1

# Get login token and authenticate Docker
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Docker Image

```bash
cd hybrid-address

# Build image
docker build -t address-intelligence:latest .

# Tag image for ECR
docker tag address-intelligence:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/address-intelligence:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/address-intelligence:latest
```

### Step 3: Create App Runner Service via AWS Console

1. Go to **AWS App Runner** → **Services** → **Create Service**
2. Choose **Container registry** as source
3. Select your ECR repository and image tag
4. Configure service:
   - **Service name**: `address-intelligence`
   - **Port**: `3000`
   - **Environment variables**:
     ```
     ADDRESS_DB_PATH=/data/address.db
     NODE_ENV=production
     ```
5. Configure auto-scaling:
   - **Min instances**: 1
   - **Max instances**: 3
   - **CPU utilization target**: 70%
6. Review and create

### Step 4: Configure Persistent Storage (EFS)

```bash
# Create EFS in the same VPC as App Runner
aws efs create-file-system \
  --performance-mode generalPurpose \
  --throughput-mode bursting \
  --tags Key=Name,Value=address-intelligence-efs

# Mount at /data in App Runner
# (Configure via App Runner service settings → Storage)
```

### Cost Estimate
- **Compute**: $0.07/hour per active instance
- **Storage**: ~$0.30/GB/month for EFS
- **Data transfer**: ~$0.09/GB (outbound)
- **Monthly estimate**: ~$150-300 for small deployment

---

## Option 2: AWS EC2 (Most Control)

**Best for**: Full control, complex requirements, persistent background jobs

### Step 1: Launch EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-keypair \
  --security-groups address-intelligence \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=address-intelligence}]' \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=50,VolumeType=gp3}'
```

### Step 2: Connect and Setup

```bash
# SSH into instance
ssh -i your-keypair.pem ec2-user@<public-ip>

# Update system
sudo yum update -y

# Install Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install build tools for better-sqlite3
sudo yum install -y python3 make g++

# Install PM2 for process management
sudo npm install -g pm2

# Create app directory
mkdir -p ~/address-intelligence
cd ~/address-intelligence
```

### Step 3: Deploy Application

```bash
# Clone/copy your application
git clone <your-repo> .
# Or upload via SCP/S3

# Install dependencies
npm ci

# Seed database
npm run db:seed

# Build
npm run build

# Start with PM2
pm2 start "npm start -- --hostname 0.0.0.0 --port 3000" \
  --name address-intelligence \
  --instances 1 \
  --exec-mode cluster

# Save PM2 configuration
pm2 save

# Enable auto-restart on boot
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### Step 4: Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo yum install -y nginx

# Create config
sudo tee /etc/nginx/conf.d/address-intelligence.conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: Setup Auto-Backup (Optional)

```bash
# Create backup script
cat > ~/backup-db.sh <<'EOF'
#!/bin/bash
BACKUP_PATH="/backups"
mkdir -p $BACKUP_PATH
sqlite3 /home/ec2-user/address-intelligence/data/address.db ".backup '$BACKUP_PATH/address-$(date +%Y%m%d-%H%M%S).db'"
# Keep only last 30 days
find $BACKUP_PATH -type f -mtime +30 -delete
EOF

chmod +x ~/backup-db.sh

# Add to crontab (daily backup at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-db.sh") | crontab -
```

### Cost Estimate
- **t3.medium instance**: ~$30/month
- **EBS storage**: ~$5/month
- **Data transfer**: ~$0.09/GB (outbound)
- **Monthly estimate**: ~$50-100 for production

---

## Option 3: AWS ECS Fargate

**Best for**: Container orchestration, multi-container apps, managed scaling

### Step 1: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name address-intelligence
```

### Step 2: Create Task Definition

```bash
# Create task-definition.json
cat > task-definition.json <<'EOF'
{
  "family": "address-intelligence",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "address-intelligence",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/address-intelligence:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ADDRESS_DB_PATH",
          "value": "/data/address.db"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "efs-storage",
          "containerPath": "/data",
          "readOnly": false
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/address-intelligence",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "efs-storage",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxxxxx",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 3: Create Fargate Service

```bash
aws ecs create-service \
  --cluster address-intelligence \
  --service-name address-intelligence \
  --task-definition address-intelligence \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/xxx,containerName=address-intelligence,containerPort=3000
```

---

## Security Configuration

### 1. Security Groups

```bash
# Create security group
aws ec2 create-security-group \
  --group-name address-intelligence \
  --description "Security group for Address Intelligence app"

# Allow HTTPS from ALB/Internet
aws ec2 authorize-security-group-ingress \
  --group-name address-intelligence \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow HTTP (optional, redirect to HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-name address-intelligence \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
```

### 2. Enable SSL/TLS

#### For App Runner: AWS Certificate Manager (automatic)
- Automatically provisions and renews SSL certificates
- No configuration needed

#### For EC2: Let's Encrypt

```bash
# Install Certbot
sudo yum install -y certbot certbot-nginx

# Request certificate (replace domain.com)
sudo certbot certonly --standalone -d domain.com

# Auto-renew
sudo systemctl enable certbot-renew
sudo systemctl start certbot-renew
```

### 3. IAM Roles and Policies

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeImages"
      ],
      "Resource": "arn:aws:ecr:us-east-1:*:repository/address-intelligence"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:DescribeMountTargets",
        "elasticfilesystem:DescribeFileSystems"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Database Encryption

```bash
# Enable EFS encryption
aws efs modify-file-system \
  --file-system-id fs-xxxxxxxx \
  --kms-key-id alias/aws/efs
```

---

## Monitoring and Logging

### CloudWatch Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /address-intelligence/app

# Set retention
aws logs put-retention-policy \
  --log-group-name /address-intelligence/app \
  --retention-in-days 30
```

### Create Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name address-intelligence-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:xxx:alerts
```

---

## Backup and Disaster Recovery

### Automated EBS Snapshots (EC2)

```bash
# Create snapshot
aws ec2 create-snapshot \
  --volume-id vol-xxxxx \
  --description "Address Intelligence DB backup"

# Schedule daily snapshots via Data Lifecycle Manager (DLM)
aws dlm create-lifecycle-policy \
  --execution-role-arn arn:aws:iam::xxx:role/dlm-default \
  --description "Daily snapshots of Address Intelligence database" \
  --state ENABLED \
  --policy-details file://dlm-policy.json
```

### RTO/RPO Strategy

| Scenario | Recovery Strategy | RTO | RPO |
|----------|------------------|-----|-----|
| Application crash | Auto-restart (PM2/ECS) | <5 min | 0 min |
| Instance failure | Auto-scaling/ECS replacement | <10 min | Last EFS snapshot |
| Database corruption | Restore from EFS snapshot | <30 min | Daily |
| Region failure | Multi-region ECR sync + DNS failover | <1 hour | Last backup |

---

## Cost Comparison

| Option | Monthly Cost | Complexity | Scaling |
|--------|-------------|-----------|---------|
| **App Runner** | $150-300 | Low | Automatic |
| **EC2 t3.medium** | $50-100 | Medium | Manual |
| **ECS Fargate** | $200-400 | High | Automatic |

---

## Post-Deployment Checklist

- [ ] Database backup configured
- [ ] SSL/TLS certificate installed
- [ ] CloudWatch monitoring enabled
- [ ] Auto-scaling configured (if applicable)
- [ ] Security groups properly configured
- [ ] Application health checks passing
- [ ] Upload limits enforced (20MB)
- [ ] Data retention policy defined
- [ ] Authentication/SSO layer added (for enterprise)
- [ ] Disaster recovery tested

---

## Common Issues & Solutions

### Issue: better-sqlite3 build fails
**Solution**: Ensure build stage includes Python and C++ compiler. Dockerfile includes this.

### Issue: Database locked errors
**Solution**: 
- Reduce concurrent requests
- Increase WAL (Write-Ahead Logging) buffer
- Use connection pooling

### Issue: Slow file uploads
**Solution**:
- Increase EBS IOPS for EC2
- Use dedicated throughput EFS
- Implement S3 staging for large uploads

### Issue: Out of disk space
**Solution**:
- Implement data retention/archival
- Monitor with CloudWatch
- Set up alerts at 80% capacity

---

## Next Steps

1. **Choose deployment option** (App Runner recommended)
2. **Set up AWS account** with appropriate permissions
3. **Create ECR repository** and push Docker image
4. **Deploy application** using chosen option
5. **Configure monitoring** and backups
6. **Add authentication layer** for enterprise use
7. **Test backup/recovery** procedures

---

## Support & Documentation

- Project docs: `docs/DEPLOYMENT.md`
- AWS App Runner: https://docs.aws.amazon.com/apprunner/
- AWS ECS: https://docs.aws.amazon.com/ecs/
- Better SQLite3: https://github.com/WiseLibs/better-sqlite3

