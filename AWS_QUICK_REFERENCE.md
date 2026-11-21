# MWTSI Address Intelligence - Quick Reference

## 📌 Project Summary

**What It Is**: A Next.js web application for processing, validating, and enriching address data with an interactive review workflow.

**Use Cases**:
- Address standardization and validation
- Data enrichment against reference databases  
- Payment address remediation
- Batch data cleanup and normalization
- Review and approval workflows for data quality

**Key Features**:
✅ Upload Excel files (up to 50,000 rows)
✅ Automatic address parsing and validation
✅ Interactive exception review interface
✅ Full audit trail and decision history
✅ Multiple export formats
✅ Local data storage (privacy-first)
✅ No external API dependencies

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────┐
│          Web Browser                        │
│     (React 19.3 + TypeScript)              │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      Next.js Server (Node.js 22)            │
│  - File upload handling                     │
│  - Address parsing & enrichment             │
│  - API routes for processing                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   Processing Engine                         │
│  - Hybrid address transformation            │
│  - Validation rules                         │
│  - Enrichment logic                         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   SQLite Database (/data/address.db)       │
│  - Batch storage                            │
│  - Processing results                       │
│  - Review history & audit trail             │
└─────────────────────────────────────────────┘
```

---

## 🚀 AWS Deployment Recommendation

### **Option: AWS App Runner** ⭐ (Best for this app)

**Why**: Stateful app needs persistent storage, managed service handles scaling, automatic SSL

**Architecture**:
```
         Internet
            ↓
    ┌───────────────┐
    │  App Runner   │  Auto-scaling, SSL/TLS
    │  (Node.js)    │  Container-based
    └───────┬───────┘
            │
      ┌─────▼──────┐
      │  EFS Mount │  Persistent SQLite database
      │  (/data)   │  Shared storage
      └────────────┘
```

**Monthly Cost**: $150-300 (includes compute + storage)

---

## 📋 Deployment Files Created

### New Files Added:

1. **`Dockerfile`**
   - Multi-stage build for optimized image
   - Installs dependencies for better-sqlite3
   - Includes health checks
   - Exposes port 3000

2. **`.dockerignore`**
   - Excludes unnecessary files from Docker build
   - Reduces image size

3. **`AWS_DEPLOYMENT.md`**
   - Comprehensive deployment guide
   - 3 AWS options (App Runner, EC2, ECS)
   - Security configuration
   - Monitoring and backup strategies
   - Cost estimates

4. **`.env.aws.example`**
   - Environment variables template
   - Database and security configs
   - Rate limiting settings
   - Backup configuration

5. **`deploy-to-aws.sh`**
   - Automated deployment script
   - Creates ECR repository
   - Builds and pushes Docker image
   - Guides service setup

---

## 🎯 Quick Start to AWS

### Prerequisites:
```bash
# Install AWS CLI
# Install Docker
# Have AWS account with:
#   - ECR access
#   - App Runner permissions
#   - IAM user with appropriate roles
```

### Deploy in 5 Steps:

```bash
# 1. Configure AWS credentials
aws configure

# 2. Make deploy script executable
chmod +x deploy-to-aws.sh

# 3. Run deployment script
./deploy-to-aws.sh

# 4. Create App Runner service (manual via AWS console)
#    Use ECR image pushed by script
#    Set environment variables from .env.aws.example
#    Mount EFS at /data

# 5. Configure custom domain + SSL
#    (App Runner handles this automatically)
```

### Environment Variables:
```bash
ADDRESS_DB_PATH=/data/address.db
NODE_ENV=production
MAX_FILE_SIZE=20971520  # 20MB
MAX_ROWS=50000
```

---

## 🔒 Security Checklist Before Production

- [ ] Configure authentication/SSO layer
- [ ] Enable encryption at rest (EFS)
- [ ] Enable encryption in transit (SSL/TLS - automatic in App Runner)
- [ ] Set up IAM roles with least privilege
- [ ] Configure security groups (restrict inbound to HTTPS only)
- [ ] Enable CloudWatch logging and monitoring
- [ ] Set up automated backups (EFS snapshots)
- [ ] Enable WAF for App Runner (optional)
- [ ] Configure rate limiting and upload limits
- [ ] Test disaster recovery procedures

---

## 📊 Cost Comparison

| Service | Monthly Cost | Best For |
|---------|-------------|----------|
| **App Runner** | $150-300 | Automatic scaling, managed service |
| **EC2 t3.medium** | $50-100 | Full control, persistent instance |
| **ECS Fargate** | $200-400 | Container orchestration |

---

## 🛠️ Common Deployment Tasks

### View Logs (App Runner):
```bash
# Via AWS Console: App Runner → Service → Logs
# Or via CLI:
aws logs tail /aws/apprunner/address-intelligence/application-logs --follow
```

### Scale Up (App Runner):
```bash
# AWS Console → App Runner → address-intelligence → Configuration
# Adjust: Max instances, CPU/Memory allocation
```

### Backup Database:
```bash
# EFS Snapshots are automatic
# Or manual via AWS Backup console
```

### Update Application:
```bash
# 1. Update code
# 2. Run: docker build & docker push
# 3. App Runner auto-deploys new image
```

---

## 📚 Documentation Structure

```
docs/
├── DEPLOYMENT.md          # Original deployment guide
├── ARCHITECTURE.md        # System design
├── REQUIREMENTS_SUMMARY.md # Feature requirements
├── HYBRID_RULES.md        # Address transformation rules
├── TEST_STRATEGY.md       # Testing approach
└── VERIFICATION.md        # Test results

(New)
├── AWS_DEPLOYMENT.md      # AWS-specific guide
└── .env.aws.example       # Configuration template
```

---

## ⚠️ Important Limitations

**Current State**:
- Single-user implementation (no multi-user auth)
- Requires C++ compiler for better-sqlite3
- Not suitable for serverless (stateful)
- Requires persistent disk storage

**Before Enterprise Deployment**:
1. Add authentication (OAuth/SAML)
2. Implement user/role-based access control
3. Add audit logging for compliance
4. Set up data retention policies
5. Configure encryption for sensitive data
6. Implement API rate limiting
7. Add monitoring and alerting

---

## 🔗 Useful Resources

- **AWS App Runner**: https://docs.aws.amazon.com/apprunner/
- **Docker Docs**: https://docs.docker.com/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **SQLite in Containers**: https://www.sqlite.org/appfileformat.html
- **EFS**: https://docs.aws.amazon.com/efs/

---

## 📞 Support

For issues or questions:
1. Check `docs/OPEN_QUESTIONS.md` for known limitations
2. Review `AWS_DEPLOYMENT.md` for troubleshooting
3. Run tests: `npm test`
4. Check application logs in CloudWatch

---

## ✅ Deployment Checklist

- [ ] Upgrade npm packages complete ✓
- [ ] Docker image created
- [ ] ECR repository ready
- [ ] App Runner service configured
- [ ] EFS storage mounted
- [ ] SSL/TLS certificate active
- [ ] CloudWatch monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security groups configured
- [ ] Authentication layer added
- [ ] Data retention policy defined
- [ ] Disaster recovery tested

---

**Last Updated**: November 20, 2026
**Package Versions**: See package.json (recently upgraded)
**Node.js**: 22 LTS or 24 LTS
