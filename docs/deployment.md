# Truehost Campus Builders — Deployment Guide
## Truehost VPS (Ubuntu 22.04)

---

## Prerequisites

- Ubuntu 22.04 VPS (minimum 4 GB RAM, 2 vCPU, 50 GB SSD)
- Domain pointing to your VPS IP (`campus.truehost.cloud`)
- SSH access to the VPS as a non-root user with sudo

---

## 1. Initial Server Setup

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## 2. Upload Application

```bash
# On your local machine — from the campus-tracking/ directory
scp -r . user@YOUR_VPS_IP:/home/user/campus-tracking/

# OR clone from your Git repository
# git clone https://github.com/yourorg/campus-tracking.git
# cd campus-tracking
```

---

## 3. Configure Environment Variables

```bash
cd /home/user/campus-tracking
cp .env.example .env
nano .env
```

Fill in every value. Critical fields:

```
DATABASE_URL=postgresql://campususer:STRONG_PASSWORD@postgres:5432/campus_tracking
NEXTAUTH_SECRET=GENERATE_WITH: openssl rand -base64 32
NEXTAUTH_URL=https://campus.truehost.cloud
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379
SMTP_HOST=mail.truehost.cloud
SMTP_USER=noreply@truehost.cloud
SMTP_PASS=your-smtp-password
APP_URL=https://campus.truehost.cloud
```

Also set Docker Compose passwords:
```bash
echo "POSTGRES_PASSWORD=STRONG_DATABASE_PASSWORD" >> .env
echo "REDIS_PASSWORD=STRONG_REDIS_PASSWORD" >> .env
```

---

## 4. SSL Certificate

```bash
# Obtain Let's Encrypt certificate (before starting Docker)
sudo certbot certonly --standalone -d campus.truehost.cloud

# Copy certificates for Nginx
sudo mkdir -p /home/user/campus-tracking/nginx/ssl
sudo cp /etc/letsencrypt/live/campus.truehost.cloud/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/campus.truehost.cloud/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*.pem
```

---

## 5. Build and Start

```bash
cd /home/user/campus-tracking

# Build images
docker compose build

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f app
```

---

## 6. Run Database Migrations and Seed

```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed with Kenyan universities and demo data
docker compose exec app npm run db:seed
```

After seeding, your demo accounts are:
- **Admin**: `admin@truehost.cloud` / `Admin@TruehostCB2024!`
- **Campus Lead (JKUAT)**: `lead.jkuat@truehost.cloud` / `Lead@JKUAT2024!`
- **Ambassador (UoN)**: `amb.uon@truehost.cloud` / `Amb@UoN2024!`

**Change all passwords immediately after first login.**

---

## 7. Auto-renew SSL

```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 3 * * 1 certbot renew --quiet && cp /etc/letsencrypt/live/campus.truehost.cloud/*.pem /home/user/campus-tracking/nginx/ssl/ && docker compose -f /home/user/campus-tracking/docker-compose.yml restart nginx
```

---

## 8. Backups

```bash
# Create backup script
cat > /home/user/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/user/backups

mkdir -p $BACKUP_DIR

# Database backup
docker compose -f /home/user/campus-tracking/docker-compose.yml exec -T postgres \
  pg_dump -U campususer campus_tracking | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x /home/user/backup.sh

# Schedule daily backups at 2 AM
(crontab -l; echo "0 2 * * * /home/user/backup.sh") | crontab -
```

---

## 9. Update Application

```bash
cd /home/user/campus-tracking

# Pull latest code (if using Git)
git pull origin main

# Rebuild and restart
docker compose build app
docker compose up -d app

# Run any new migrations
docker compose exec app npx prisma migrate deploy
```

---

## 10. Monitoring

```bash
# View logs
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f nginx

# Check resource usage
docker stats

# Access database directly
docker compose exec postgres psql -U campususer -d campus_tracking
```

---

## 11. Useful Admin Commands

```bash
# Open Prisma Studio (database GUI) — temporarily
docker compose exec app npx prisma studio

# Reset a user password manually
docker compose exec app node -e "
const {hash} = require('bcryptjs');
const {PrismaClient} = require('@prisma/client');
const db = new PrismaClient();
hash('NewPassword123!', 12).then(h => 
  db.user.update({where:{email:'user@example.com'}, data:{passwordHash:h}})
).then(console.log);
"
```

---

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Configure firewall: only ports 80, 443, and 22 exposed
- [ ] Enable automatic security updates: `sudo apt install unattended-upgrades`
- [ ] Review Nginx security headers in `nginx.conf`
- [ ] Confirm `NEXTAUTH_SECRET` is a unique, random 32+ character string
- [ ] Keep SSL certificates renewed
- [ ] Test backup restore procedure quarterly
