#!/bin/bash
set -e

echo "=========================================="
echo "  Sanayad Learn - Deployment Script"
echo "=========================================="

# --- Configuration ---
DOMAIN="learn.sanayadtech.com"
EMAIL="admin@sanayadtech.com"
APP_DIR="/opt/skool-clone"

# Generate secrets if .env doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
    echo ""
    echo "📝 Creating .env file with generated secrets..."
    DB_PASSWORD=$(openssl rand -hex 24)
    AUTH_SECRET=$(openssl rand -hex 32)
    cat > "$APP_DIR/.env" <<EOF
DB_PASSWORD=$DB_PASSWORD
AUTH_SECRET=$AUTH_SECRET
EOF
    echo "  ✓ .env created with secure random passwords"
else
    echo "  ✓ .env already exists, keeping existing secrets"
fi

source "$APP_DIR/.env"

# --- Step 1: Start with HTTP-only nginx (for SSL cert) ---
echo ""
echo "🔧 Step 1: Starting services with HTTP-only config..."
cp "$APP_DIR/nginx/conf.d/default.conf.nossl" "$APP_DIR/nginx/conf.d/default.conf.bak"
cp "$APP_DIR/nginx/conf.d/default.conf.nossl" "$APP_DIR/nginx/conf.d/default.conf"

cd "$APP_DIR"
docker compose up -d db
echo "  ⏳ Waiting for database to be ready..."
sleep 10

docker compose up -d --build app
echo "  ⏳ Waiting for app to start..."
sleep 15

docker compose up -d nginx
sleep 5

# --- Step 2: Get SSL certificate ---
echo ""
echo "🔐 Step 2: Obtaining SSL certificate for $DOMAIN..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# --- Step 3: Switch to SSL nginx config ---
echo ""
echo "🔄 Step 3: Switching to SSL nginx config..."
cp "$APP_DIR/nginx/conf.d/default.conf.bak" "$APP_DIR/nginx/conf.d/default.conf.nossl"
# Restore the SSL config
cat > "$APP_DIR/nginx/conf.d/default.conf" <<'NGINXEOF'
server {
    listen 80;
    server_name learn.sanayadtech.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name learn.sanayadtech.com;

    ssl_certificate /etc/letsencrypt/live/learn.sanayadtech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/learn.sanayadtech.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

docker compose restart nginx
sleep 3

# --- Step 4: Run database migrations and seed ---
echo ""
echo "🗄️  Step 4: Setting up database..."
docker compose exec app npx prisma db push
echo "  ✓ Database schema applied"

docker compose exec app npx tsx prisma/seed.ts 2>/dev/null || echo "  ⚠ Seed skipped (may already exist)"

# --- Done ---
echo ""
echo "=========================================="
echo "  ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "  🌐 Your site is live at: https://$DOMAIN"
echo "  📧 Admin login: admin@sanayadtech.com"
echo "  🔑 Admin password: admin123!"
echo ""
echo "  ⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
