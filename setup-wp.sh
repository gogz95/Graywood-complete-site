#!/bin/sh
set -e

echo "Waiting for MariaDB connection..."
until wp db check --path=/var/www/html --quiet 2>/dev/null; do
  sleep 3
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

  echo "Creating dedicated domain landing pages..."
  # 1. graywood.no (Central Hub & Admin)
  wp post create --path=/var/www/html --post_type=page --post_title="Graywood" --post_name="graywood-hub" --post_status=publish
  # 2. graywoodmedia.no (Creative Collective)
  wp post create --path=/var/www/html --post_type=page --post_title="Graywood Media" --post_name="graywood-media" --post_status=publish
  # 3. graywoodphotography.no (Photography Business)
  wp post create --path=/var/www/html --post_type=page --post_title="Graywood Photography" --post_name="graywood-photography" --post_status=publish
  # Client Delivery Portal
  wp post create --path=/var/www/html --post_type=page --post_title="Client Deliveries" --post_name="client-deliveries" --post_status=publish --post_password="ClientPass2026!"

  echo "Creating equipment categories..."
  wp term create gear_category "Bodies" --path=/var/www/html || true
  wp term create gear_category "Lenses" --path=/var/www/html || true
  wp term create gear_category "Lighting" --path=/var/www/html || true
  wp term create gear_category "Bags & Rigs" --path=/var/www/html || true

  echo "WordPress bootstrap complete!"
else
  echo "WordPress is already installed. Ensuring graywood-theme is active..."
  wp theme activate graywood-theme --path=/var/www/html || true
fi
