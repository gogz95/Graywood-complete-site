# =============================================================================
# Graywood Local WordPress Runtime Setup & Runner
# Standalone PHP 8.2 + SQLite-based WordPress 6.7 + Graywood Block Theme
# =============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WpEnvDir = Join-Path $ScriptDir ".wp-env"
$PhpDir = Join-Path $WpEnvDir "php"
$PhpExe = Join-Path $PhpDir "php.exe"
$WpDir = Join-Path $WpEnvDir "wordpress"
$ThemeSource = Join-Path $ScriptDir "wp-theme\graywood-theme"
$ThemeDest = Join-Path $WpDir "wp-content\themes\graywood-theme"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Graywood Local WordPress Runtime Engine" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if (-not (Test-Path $WpEnvDir)) {
    New-Item -ItemType Directory -Path $WpEnvDir -Force | Out-Null
}

# -----------------------------------------------------------------------------
# 1. Portable PHP 8.2
# -----------------------------------------------------------------------------
if (-not (Test-Path $PhpExe)) {
    Write-Host "[1/5] Downloading portable PHP 8.2 for Windows..." -ForegroundColor Yellow
    $phpZip = Join-Path $WpEnvDir "php.zip"
    $phpUrl = "https://windows.php.net/downloads/releases/php-8.2.33-nts-Win32-vs16-x64.zip"
    Invoke-WebRequest -Uri $phpUrl -OutFile $phpZip -UseBasicParsing
    
    Write-Host "      Extracting PHP..." -ForegroundColor Yellow
    Expand-Archive -Path $phpZip -DestinationPath $PhpDir -Force
    Remove-Item $phpZip -Force

    # Configure php.ini
    $iniTemplate = Join-Path $PhpDir "php.ini-development"
    $phpIni = Join-Path $PhpDir "php.ini"
    if (Test-Path $iniTemplate) {
        Copy-Item $iniTemplate $phpIni -Force
        $content = Get-Content $phpIni -Raw
        $content = $content -replace ';extension_dir = "ext"', 'extension_dir = "ext"'
        $content = $content -replace ';extension=curl', 'extension=curl'
        $content = $content -replace ';extension=fileinfo', 'extension=fileinfo'
        $content = $content -replace ';extension=gd', 'extension=gd'
        $content = $content -replace ';extension=mbstring', 'extension=mbstring'
        $content = $content -replace ';extension=openssl', 'extension=openssl'
        $content = $content -replace ';extension=pdo_sqlite', 'extension=pdo_sqlite'
        $content = $content -replace ';extension=sqlite3', 'extension=sqlite3'
        $content += "`nmemory_limit = 256M`nmax_execution_time = 120`nupload_max_filesize = 64M`npost_max_size = 64M`n"
        Set-Content $phpIni $content
    }
    Write-Host "      PHP 8.2 installed and configured." -ForegroundColor Green
} else {
    Write-Host "[1/5] Portable PHP 8.2 already present." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 2. WordPress 6.7 Core
# -----------------------------------------------------------------------------
$wpVersionFile = Join-Path $WpDir "wp-includes\version.php"
if (-not (Test-Path $wpVersionFile)) {
    Write-Host "[2/5] Downloading official WordPress core..." -ForegroundColor Yellow
    $wpZip = Join-Path $WpEnvDir "wordpress.zip"
    Invoke-WebRequest -Uri "https://wordpress.org/latest.zip" -OutFile $wpZip -UseBasicParsing
    
    Write-Host "      Extracting WordPress..." -ForegroundColor Yellow
    Expand-Archive -Path $wpZip -DestinationPath $WpEnvDir -Force
    Remove-Item $wpZip -Force
    Write-Host "      WordPress core installed." -ForegroundColor Green
} else {
    Write-Host "[2/5] WordPress core already present." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 3. SQLite Database Integration (Zero-Daemon Storage)
# -----------------------------------------------------------------------------
$sqlitePluginDir = Join-Path $WpDir "wp-content\plugins\sqlite-database-integration"
$dbPhp = Join-Path $WpDir "wp-content\db.php"
if (-not (Test-Path $dbPhp)) {
    Write-Host "[3/5] Installing official SQLite Database Integration..." -ForegroundColor Yellow
    $sqliteZip = Join-Path $WpEnvDir "sqlite.zip"
    Invoke-WebRequest -Uri "https://downloads.wordpress.org/plugin/sqlite-database-integration.zip" -OutFile $sqliteZip -UseBasicParsing
    Expand-Archive -Path $sqliteZip -DestinationPath (Join-Path $WpDir "wp-content\plugins") -Force
    Remove-Item $sqliteZip -Force

    $dbCopy = Join-Path $sqlitePluginDir "db.copy"
    if (Test-Path $dbCopy) {
        Copy-Item $dbCopy $dbPhp -Force
    }
    Write-Host "      SQLite drop-in (db.php) active." -ForegroundColor Green
} else {
    Write-Host "[3/5] SQLite drop-in already configured." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. Sync Graywood Theme
# -----------------------------------------------------------------------------
Write-Host "[4/5] Syncing Graywood block theme..." -ForegroundColor Yellow
if (-not (Test-Path (Join-Path $WpDir "wp-content\themes"))) {
    New-Item -ItemType Directory -Path (Join-Path $WpDir "wp-content\themes") -Force | Out-Null
}
if (Test-Path $ThemeDest) {
    Remove-Item -Recurse -Force $ThemeDest
}
Copy-Item -Recurse $ThemeSource $ThemeDest -Force
Write-Host "      Graywood theme synced to wp-content/themes/graywood-theme." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 5. wp-config.php and Initialization
# -----------------------------------------------------------------------------
$wpConfig = Join-Path $WpDir "wp-config.php"
if (-not (Test-Path $wpConfig)) {
    Write-Host "[5/5] Generating wp-config.php..." -ForegroundColor Yellow
    $configContent = @'
<?php
define( 'DB_NAME', 'graywood_db' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'DB_DIR', __DIR__ . '/wp-content/database/' );
define( 'DB_FILE', '.ht.sqlite' );

define( 'AUTH_KEY',         'graywood-auth-key-salt-2026-nordic-studio' );
define( 'SECURE_AUTH_KEY',  'graywood-secure-auth-key-salt-2026-nordic-studio' );
define( 'LOGGED_IN_KEY',    'graywood-logged-in-key-salt-2026-nordic-studio' );
define( 'NONCE_KEY',        'graywood-nonce-key-salt-2026-nordic-studio' );
define( 'AUTH_SALT',        'graywood-auth-salt-nordic-canvas-2026' );
define( 'SECURE_AUTH_SALT', 'graywood-secure-auth-salt-nordic-canvas-2026' );
define( 'LOGGED_IN_SALT',   'graywood-logged-in-salt-nordic-canvas-2026' );
define( 'NONCE_SALT',       'graywood-nonce-salt-nordic-canvas-2026' );

$table_prefix = 'gw_';

define( 'WP_DEBUG', false );
define( 'WP_HOME', 'http://localhost:8080' );
define( 'WP_SITEURL', 'http://localhost:8080' );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
'@
    Set-Content $wpConfig $configContent
}

# Run seed/provisioning script
$seedScript = Join-Path $WpEnvDir "seed.php"
$seedContent = @'
<?php
define('WP_INSTALLING', true);
require_once __DIR__ . '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';
require_once ABSPATH . 'wp-admin/includes/post.php';

// Check if WP already installed
global $wpdb;
$installed = false;
try {
    $installed = is_blog_installed();
} catch (\Throwable $e) {
    $installed = false;
}

if (!$installed) {
    echo "Installing WordPress database schema...\n";
    wp_install('Graywood Studio', 'admin', 'admin@graywood.local', true, '', 'AdminPassword123!');
    echo "WordPress database created.\n";
}

// Activate Graywood theme
switch_theme('graywood-theme');
echo "Theme set to: " . get_stylesheet() . "\n";

// Ensure permalink structure
update_option('permalink_structure', '/%postname%/');

// Seed Home page if missing
$home_page = get_page_by_path('home');
if (!$home_page) {
    $home_id = wp_insert_post([
        'post_title'   => 'Home',
        'post_name'    => 'home',
        'post_status'  => 'publish',
        'post_type'    => 'page',
        'post_content' => '<!-- wp:paragraph --><p>Welcome to Graywood Studio.</p><!-- /wp:paragraph -->'
    ]);
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_id);
    echo "Created Home page (ID: {$home_id})\n";
} else {
    update_option('show_on_front', 'page');
    update_option('page_on_front', $home_page->ID);
}

// Seed Client Deliveries page with password
$delivery_page = get_page_by_path('client-deliveries');
if (!$delivery_page) {
    $delivery_id = wp_insert_post([
        'post_title'    => 'Client Deliveries',
        'post_name'     => 'client-deliveries',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'post_password' => 'graywood2026',
        'post_content'  => '<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"28px"}},"fontFamily":"playfair"} --><h2 class="wp-block-heading has-text-align-center has-playfair-font-family" style="font-size:28px">Private Client Proofing Vault</h2><!-- /wp:heading --><!-- wp:paragraph {"align":"center","textColor":"nordic-subtle"} --><p class="has-text-align-center has-nordic-subtle-color has-text-color">Authentication verified. Your curated proofs are ready for high-resolution review and export.</p><!-- /wp:paragraph --><!-- wp:spacer {"height":"30px"} --><div style="height:30px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"nordic-pine","textColor":"nordic-surface","style":{"border":{"radius":"12px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"32px","right":"32px"}}}} --><div class="wp-block-button"><a class="wp-block-button__link has-nordic-pine-background-color has-nordic-surface-color has-text-color has-background wp-element-button" style="border-radius:12px;padding-top:14px;padding-right:32px;padding-bottom:14px;padding-left:32px" href="#">Download Master Package (ZIP) ↓</a></div><!-- /wp:button --></div><!-- /wp:buttons -->'
    ]);
    update_post_meta($delivery_id, '_wp_page_template', 'page-client-delivery');
    echo "Created Client Deliveries page (ID: {$delivery_id})\n";
}

// Seed Portfolio page
$portfolio_page = get_page_by_path('portfolio');
if (!$portfolio_page) {
    $port_id = wp_insert_post([
        'post_title'   => 'Portfolio',
        'post_name'    => 'portfolio',
        'post_status'  => 'publish',
        'post_type'    => 'page',
        'post_content' => '<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontSize":"clamp(1.75rem, 4vw, 2.75rem)"}},"fontFamily":"playfair"} --><h2 class="wp-block-heading has-text-align-center has-playfair-font-family" style="font-size:clamp(1.75rem, 4vw, 2.75rem)">Selected Works</h2><!-- /wp:heading --><!-- wp:paragraph {"align":"center","textColor":"nordic-subtle"} --><p class="has-text-align-center has-nordic-subtle-color has-text-color">Curated medium-format stills and motion media production archive.</p><!-- /wp:paragraph -->'
    ]);
    echo "Created Portfolio page (ID: {$port_id})\n";
}

update_option('blogdescription', 'Scandinavian Visual Production Platform');
update_option('default_comment_status', 'closed');
echo "Provisioning completed successfully.\n";
'@
Set-Content $seedScript $seedContent

Write-Host "Running WordPress provisioning..." -ForegroundColor Yellow
& $PhpExe $seedScript

# Router script for PHP built-in web server to support clean URLs, scripts, and static files
$routerScript = Join-Path $WpEnvDir "router.php"
$routerContent = @'
<?php
$root = __DIR__ . '/wordpress';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = $root . $path;

if (is_dir($file)) {
    $file = rtrim($file, '/') . '/index.php';
    $path = rtrim($path, '/') . '/index.php';
}

if (file_exists($file)) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        $_SERVER['SCRIPT_FILENAME'] = $file;
        $_SERVER['SCRIPT_NAME'] = $path;
        $_SERVER['PHP_SELF'] = $path;
        chdir(dirname($file));
        require $file;
        return;
    }
    return false; // Serve static assets directly (CSS, JS, fonts, images)
}

$_SERVER['SCRIPT_FILENAME'] = $root . '/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

chdir($root);
require $root . '/index.php';
'@
Set-Content $routerScript $routerContent

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  Graywood WordPress is ready!" -ForegroundColor Green
Write-Host "  URL:     http://localhost:8080" -ForegroundColor Green
Write-Host "  Admin:   http://localhost:8080/wp-admin/" -ForegroundColor Green
Write-Host "  User:    admin" -ForegroundColor Green
Write-Host "  Pass:    AdminPassword123!" -ForegroundColor Green
Write-Host "  Vault:   http://localhost:8080/client-deliveries/ (Pass: graywood2026)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Starting built-in server on http://localhost:8080 ... (Press Ctrl+C to stop)" -ForegroundColor Cyan

& $PhpExe -S "localhost:8080" -t $WpDir -c (Join-Path $PhpDir "php.ini") $routerScript

