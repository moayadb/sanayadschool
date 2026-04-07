#!/bin/bash
set -e

echo "=========================================="
echo "  Sanayad Learn - Deployment Script"
echo "=========================================="

APP_DIR="/opt/sanayadschool"
DOMAIN="learn.sanayadtech.com"

# --- Step 1: Generate .env ---
if [ ! -f "$APP_DIR/.env" ]; then
    echo ""
    echo "Step 1: Creating .env file..."
    DB_PASSWORD=$(openssl rand -hex 24)
    AUTH_SECRET=$(openssl rand -hex 32)
    cat > "$APP_DIR/.env" << EOF
DB_PASSWORD=$DB_PASSWORD
AUTH_SECRET=$AUTH_SECRET
EOF
    echo "  Done - .env created"
else
    echo "Step 1: .env already exists, keeping it"
fi

source "$APP_DIR/.env"

# --- Step 2: Build and start containers ---
echo ""
echo "Step 2: Building and starting containers..."
cd "$APP_DIR"
docker compose down 2>/dev/null || true
docker compose up -d --build
echo "  Waiting for app to start..."
sleep 20

# --- Step 3: Run database migrations and seed ---
echo ""
echo "Step 3: Setting up database..."
docker compose exec app npx prisma db push
echo "  Database schema applied"

docker compose exec app npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed skipped (may already exist)"

# --- Step 4: Configure Caddy reverse proxy ---
echo ""
echo "Step 4: Configuring Caddy proxy for $DOMAIN..."

# Find HestiaCP's proxy config for this domain and update it
HESTIA_PROXY="/home/admin/conf/web/$DOMAIN/caddy.conf"
if [ -d "/usr/local/hestia" ]; then
    echo "  HestiaCP detected."
    echo "  Please configure $DOMAIN in HestiaCP to proxy to localhost:3100"
    echo "  Or run: v-add-web-domain-backend admin $DOMAIN localhost 3100"
else
    # Direct Caddy config
    CADDY_CONF="/etc/caddy/Caddyfile"
    if [ -f "$CADDY_CONF" ]; then
        if ! grep -q "$DOMAIN" "$CADDY_CONF"; then
            cat >> "$CADDY_CONF" << CADDYEOF

$DOMAIN {
    reverse_proxy localhost:3100
}
CADDYEOF
            systemctl reload caddy
            echo "  Caddy config added and reloaded"
        else
            echo "  $DOMAIN already in Caddy config"
        fi
    fi
fi

# --- Done ---
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "  Site: https://$DOMAIN"
echo "  Admin: admin@sanayadtech.com"
echo "  Password: admin123!"
echo ""
echo "  Change the admin password after first login!"
echo ""
