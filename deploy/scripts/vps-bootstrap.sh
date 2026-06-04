#!/usr/bin/env bash
# Run on Ubuntu 24.04 VPS as root or with sudo.
# Usage: curl -fsSL ... | bash   OR   bash vps-bootstrap.sh
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/tracker}"
REPO_URL="${REPO_URL:-https://github.com/Allen-1-web/Tracker.git}"

echo "==> Packages"
apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw

echo "==> Docker"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin certbot

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "==> User $DEPLOY_USER"
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo,docker "$DEPLOY_USER"
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  if [[ -f /root/.ssh/authorized_keys ]]; then
    cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  fi
fi

echo "==> App directory $APP_DIR"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Done. Next (as $DEPLOY_USER):"
echo "  git clone $REPO_URL $APP_DIR"
echo "  cd $APP_DIR && cp frontend/.env.production.example frontend/.env.production"
echo "  # fill .env files — see DEPLOY.md"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
