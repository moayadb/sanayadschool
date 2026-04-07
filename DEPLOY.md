# Deployment Guide — Sanayad Learn

## Prerequisites on your Contabo VPS
- Ubuntu 20.04+ (or Debian)
- Docker & Docker Compose installed
- Domain `learn.sanayadtech.com` DNS A record pointing to your VPS IP

## One-Command Deployment

**SSH into your VPS**, then run this single block of commands:

```bash
# 1. Install Docker if not already installed
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Docker Compose plugin
sudo apt-get update && sudo apt-get install -y docker-compose-plugin

# 3. Clone the project
sudo mkdir -p /opt/skool-clone
cd /opt/skool-clone

# 4. Upload the project files (from your local machine, run this LOCALLY):
#    scp -r . root@YOUR_VPS_IP:/opt/skool-clone/
#    OR use git:
#    git clone https://github.com/YOUR_USERNAME/skool-clone.git /opt/skool-clone

# 5. Deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

## After Deployment

- Site will be live at: **https://learn.sanayadtech.com**
- Admin login: `admin@sanayadtech.com` / `admin123!`
- **Change the admin password immediately** after first login

## Updating the Site

```bash
cd /opt/skool-clone
git pull  # or re-upload files
docker compose up -d --build app
docker compose restart nginx
```

## Useful Commands

```bash
# View logs
docker compose logs -f app

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Database access
docker compose exec db psql -U skool -d skool_clone

# Re-seed database
docker compose exec app npx tsx prisma/seed.ts
```
