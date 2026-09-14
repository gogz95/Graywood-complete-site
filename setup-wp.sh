#!/bin/sh
set -e

echo "Waiting for WordPress wp-config.php and MariaDB connection..."
until [ -f /var/www/html/wp-config.php ] && php -r 'require "/var/www/html/wp-config.php"; $c = @mysqli_init(); exit(@mysqli_real_connect($c, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) ? 0 : 1);' 2>/dev/null; do
  sleep 2
done

if ! wp core is-installed --path=/var/www/html 2>/dev/null; then
  echo "Installing WordPress core..."
  wp core install \
    --path=/var/www/html \
    --url="http://localhost:8080" \
    --title="Graywood" \
    --admin_user="admin" \
    --admin_password="AdminPassword123!" \
    --admin_email="admin@graywood.local" \
    --skip-email

  echo "Activating graywood-theme..."
  wp theme activate graywood-theme --path=/var/www/html

  echo "Setting permalinks to postname..."
  wp rewrite structure '/%postname%/' --path=/var/www/html
else
  echo "WordPress is already installed. Ensuring graywood-theme is active..."
  wp theme activate graywood-theme --path=/var/www/html || true
  wp rewrite structure '/%postname%/' --path=/var/www/html || true
fi

echo "Ensuring dedicated domain landing pages and deliverables exist..."
# 1. graywood-hub (Graywood)
HUB_ID=$(wp post list --path=/var/www/html --post_type=page --name="graywood-hub" --field=ID 2>/dev/null | head -n 1)
if [ -z "$HUB_ID" ]; then
  HUB_ID=$(wp post create --path=/var/www/html --post_type=page --post_title="Graywood" --post_name="graywood-hub" --post_status=publish --porcelain)
fi
wp option update show_on_front "page" --path=/var/www/html || true
wp option update page_on_front "$HUB_ID" --path=/var/www/html || true

# 2. graywood-media (Graywood Media)
if ! wp post list --path=/var/www/html --post_type=page --name="graywood-media" --field=ID 2>/dev/null | grep -q '^[0-9]'; then
  wp post create --path=/var/www/html --post_type=page --post_title="Graywood Media" --post_name="graywood-media" --post_status=publish
fi

# 3. graywood-photography (Graywood Photography)
if ! wp post list --path=/var/www/html --post_type=page --name="graywood-photography" --field=ID 2>/dev/null | grep -q '^[0-9]'; then
  wp post create --path=/var/www/html --post_type=page --post_title="Graywood Photography" --post_name="graywood-photography" --post_status=publish
fi

# 4. client-deliveries (Client Deliveries, Password: ClientPass2026!)
CLIENT_PAGE_ID=$(wp post list --path=/var/www/html --post_type=page --name="client-deliveries" --field=ID 2>/dev/null | head -n 1)
if [ -n "$CLIENT_PAGE_ID" ]; then
  wp post update "$CLIENT_PAGE_ID" --path=/var/www/html --post_password="ClientPass2026!" --post_title="Client Deliveries"
else
  wp post create --path=/var/www/html --post_type=page --post_title="Client Deliveries" --post_name="client-deliveries" --post_status=publish --post_password="ClientPass2026!"
fi

echo "Ensuring equipment categories and shoot manifests..."
wp term create gear_category "Bodies" --path=/var/www/html || true
wp term create gear_category "Lenses" --path=/var/www/html || true
wp term create gear_category "Lighting" --path=/var/www/html || true
wp term create gear_category "Bags & Rigs" --path=/var/www/html || true

wp term create shoot_manifest "Concert Low-Light" --path=/var/www/html || true
wp term create shoot_manifest "Studio Portrait" --path=/var/www/html || true
wp term create shoot_manifest "Commercial Video" --path=/var/www/html || true

echo "WordPress bootstrap and taxonomy seeding complete!"
