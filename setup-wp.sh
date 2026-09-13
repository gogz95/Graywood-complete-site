#!/bin/sh
# =============================================================================
# Graywood WordPress Auto-Provisioner
# Runs once via WP-CLI to install WordPress, activate the theme, and seed pages.
# =============================================================================

set -e

echo "============================================"
echo "  Graywood WordPress Auto-Provisioner"
echo "============================================"

# ---------------------------------------------------------------------------
# 1. Wait for WordPress core files to be available
# ---------------------------------------------------------------------------
echo "[1/7] Waiting for WordPress core files..."
MAX_WAIT=120
WAITED=0
while [ ! -f /var/www/html/wp-includes/version.php ]; do
  sleep 2
  WAITED=$((WAITED + 2))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "ERROR: WordPress core files not found after ${MAX_WAIT}s. Aborting."
    exit 1
  fi
done
echo "  WordPress files detected after ${WAITED}s."

# ---------------------------------------------------------------------------
# 2. Wait for database connection
# ---------------------------------------------------------------------------
echo "[2/7] Waiting for database connection..."
WAITED=0
until wp db check --quiet 2>/dev/null; do
  sleep 3
  WAITED=$((WAITED + 3))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "ERROR: Database not reachable after ${MAX_WAIT}s. Aborting."
    exit 1
  fi
done
echo "  Database connection confirmed after ${WAITED}s."

# ---------------------------------------------------------------------------
# 3. Install WordPress core
# ---------------------------------------------------------------------------
if wp core is-installed 2>/dev/null; then
  echo "[3/7] WordPress already installed. Skipping core install."
else
  echo "[3/7] Installing WordPress core..."
  wp core install \
    --url="http://localhost:8080" \
    --title="Graywood" \
    --admin_user="admin" \
    --admin_password="AdminPassword123!" \
    --admin_email="admin@graywood.local" \
    --skip-email
  echo "  WordPress installed successfully."
fi

# ---------------------------------------------------------------------------
# 4. Activate the Graywood theme
# ---------------------------------------------------------------------------
echo "[4/7] Activating Graywood theme..."
wp theme activate graywood-theme
echo "  Theme activated: graywood-theme"

# ---------------------------------------------------------------------------
# 5. Configure permalinks
# ---------------------------------------------------------------------------
echo "[5/7] Configuring permalinks..."
wp rewrite structure '/%postname%/' --hard
wp rewrite flush --hard
echo "  Permalinks set to /%postname%/"

# ---------------------------------------------------------------------------
# 6. Seed standard Graywood pages
# ---------------------------------------------------------------------------
echo "[6/7] Creating Graywood pages..."

# Home page (uses front-page template)
if ! wp post list --post_type=page --name=home --format=ids 2>/dev/null | grep -q '[0-9]'; then
  HOME_ID=$(wp post create \
    --post_type=page \
    --post_title="Home" \
    --post_name="home" \
    --post_status=publish \
    --porcelain)
  echo "  Created 'Home' page (ID: ${HOME_ID})"
else
  echo "  'Home' page already exists. Skipping."
fi

# Portfolio page
if ! wp post list --post_type=page --name=portfolio --format=ids 2>/dev/null | grep -q '[0-9]'; then
  PORTFOLIO_ID=$(wp post create \
    --post_type=page \
    --post_title="Portfolio" \
    --post_name="portfolio" \
    --post_status=publish \
    --post_content='<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"clamp(1.75rem, 4vw, 2.75rem)","fontWeight":"400"}},"fontFamily":"playfair"} --><h2 class="wp-block-heading has-text-align-center has-playfair-font-family" style="font-size:clamp(1.75rem, 4vw, 2.75rem);font-weight:400">Selected Works</h2><!-- /wp:heading --><!-- wp:paragraph {"align":"center","textColor":"nordic-subtle"} --><p class="has-text-align-center has-nordic-subtle-color has-text-color">A curated collection of photographic and cinematic work from Graywood Studio.</p><!-- /wp:paragraph --><!-- wp:gallery {"columns":3,"linkTo":"none","style":{"spacing":{"blockGap":"8px"}}} --><!-- /wp:gallery -->' \
    --porcelain)
  echo "  Created 'Portfolio' page (ID: ${PORTFOLIO_ID})"
else
  echo "  'Portfolio' page already exists. Skipping."
fi

# Client Deliveries page (password-protected, uses client-delivery template)
if ! wp post list --post_type=page --name=client-deliveries --format=ids 2>/dev/null | grep -q '[0-9]'; then
  CLIENT_ID=$(wp post create \
    --post_type=page \
    --post_title="Client Deliveries" \
    --post_name="client-deliveries" \
    --post_status=publish \
    --post_password="graywood2026" \
    --post_content='<!-- wp:gallery {"columns":3,"linkTo":"media","style":{"spacing":{"blockGap":"8px"}}} --><!-- /wp:gallery --><!-- wp:spacer {"height":"40px"} --><div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"nordic-pine","textColor":"nordic-surface","style":{"border":{"radius":"12px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"32px","right":"32px"}}}} --><div class="wp-block-button"><a class="wp-block-button__link has-nordic-pine-background-color has-nordic-surface-color has-text-color has-background wp-element-button" style="border-radius:12px;padding-top:14px;padding-right:32px;padding-bottom:14px;padding-left:32px" href="#">Download All (ZIP) ↓</a></div><!-- /wp:button --></div><!-- /wp:buttons -->' \
    --porcelain)
  # Set the page template to client delivery
  wp post meta update "${CLIENT_ID}" _wp_page_template "page-client-delivery"
  echo "  Created 'Client Deliveries' page (ID: ${CLIENT_ID}) — password: graywood2026"
else
  echo "  'Client Deliveries' page already exists. Skipping."
fi

# ---------------------------------------------------------------------------
# 7. Configure reading settings (static front page)
# ---------------------------------------------------------------------------
echo "[7/7] Configuring front page display..."
HOME_PAGE_ID=$(wp post list --post_type=page --name=home --format=ids 2>/dev/null | tr -d '[:space:]')
if [ -n "$HOME_PAGE_ID" ]; then
  wp option update show_on_front page
  wp option update page_on_front "${HOME_PAGE_ID}"
  echo "  Front page set to 'Home' (ID: ${HOME_PAGE_ID})"
fi

# Set site tagline
wp option update blogdescription "Scandinavian Visual Production Platform"

# Disable comments by default
wp option update default_comment_status closed

echo ""
echo "============================================"
echo "  Graywood provisioning complete!"
echo ""
echo "  Site:     http://localhost:8080"
echo "  Admin:    http://localhost:8080/wp-admin/"
echo "  User:     admin"
echo "  Password: AdminPassword123!"
echo ""
echo "  Client Delivery Password: graywood2026"
echo "============================================"
