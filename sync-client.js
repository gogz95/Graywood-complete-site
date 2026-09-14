/**
 * Graywood Automated Ingestion Client
 *
 * Connects to the WordPress REST API, extracts pages, posts, featured media,
 * and delivery_data (protection status, ZIP package URLs, and gallery assets),
 * and writes a structured payload to site-data.json.
 */

const fs = require('fs');
const path = require('path');

const WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8080';
const ROOT_OUTPUT = path.join(__dirname, 'cached-content.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_OUTPUT = path.join(PUBLIC_DIR, 'cached-content.json');

async function fetchJSON(endpoint) {
  const url = `${WP_BASE_URL}/wp-json/wp/v2/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress REST API returned ${response.status} ${response.statusText} at ${url}`);
  }

  return await response.json();
}

function extractFeaturedMedia(item) {
  if (item.featured_image_url) {
    return item.featured_image_url;
  }
  if (item._embedded && item._embedded['wp:featuredmedia'] && item._embedded['wp:featuredmedia'][0]) {
    const media = item._embedded['wp:featuredmedia'][0];
    return media.source_url || media.media_details?.sizes?.full?.source_url || null;
  }
  return null;
}

function normalizeItem(item) {
  return {
    id: item.id,
    title: item.title?.rendered || '',
    slug: item.slug || '',
    permalink: item.link || '',
    date: item.date || null,
    modified: item.modified || null,
    featured_image: extractFeaturedMedia(item),
    delivery_data: item.delivery_data || {
      is_password_protected: item.content?.protected || false,
      zip_download_url: null,
      gallery_images: [],
    },
  };
}

async function runSync() {
  console.log('==================================================');
  console.log('  Graywood Automated Ingestion Client             ');
  console.log('==================================================');
  console.log(`Connecting to: ${WP_BASE_URL}\n`);

  try {
    const [pagesRaw, postsRaw] = await Promise.all([
      fetchJSON('pages?_embed&per_page=100&status=publish'),
      fetchJSON('posts?_embed&per_page=100&status=publish').catch(() => []),
    ]);

    console.log(`[✓] Fetched ${pagesRaw.length} pages.`);
    console.log(`[✓] Fetched ${postsRaw.length} posts.`);

    const pages = pagesRaw.map(normalizeItem);
    const posts = postsRaw.map(normalizeItem);

    const clientVaults = pages.filter(p => p.delivery_data.is_password_protected || p.slug === 'client-deliveries');
    const portfolioPages = pages.filter(p => p.slug === 'portfolio' || p.slug === 'home');

    const payload = {
      generated_at: new Date().toISOString(),
      source_url: WP_BASE_URL,
      summary: {
        total_pages: pages.length,
        total_posts: posts.length,
        total_client_vaults: clientVaults.length,
        total_portfolio_entries: portfolioPages.length,
      },
      client_deliverables: clientVaults.map(vault => ({
        id: vault.id,
        title: vault.title,
        slug: vault.slug,
        permalink: vault.permalink,
        is_password_protected: vault.delivery_data.is_password_protected,
        zip_download_url: vault.delivery_data.zip_download_url,
        gallery_images: vault.delivery_data.gallery_images,
      })),
      portfolio: portfolioPages,
      pages: pages,
      posts: posts,
    };

    const formattedJSON = JSON.stringify(payload, null, 2);

    // Write to root
    fs.writeFileSync(ROOT_OUTPUT, formattedJSON, 'utf8');
    console.log(`[✓] Saved: ${ROOT_OUTPUT}`);

    // Also write to public/ if present or create it
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    fs.writeFileSync(PUBLIC_OUTPUT, formattedJSON, 'utf8');
    console.log(`[✓] Saved: ${PUBLIC_OUTPUT}`);

    console.log('\n--- Sync Results ---');
    console.log(`• Client Deliverables: ${clientVaults.length}`);
    clientVaults.forEach(v => {
      console.log(`  - [Vault] ${v.title} (${v.slug})`);
      console.log(`    Password Protected: ${v.delivery_data.is_password_protected ? 'YES' : 'NO'}`);
      console.log(`    ZIP Download URL:   ${v.delivery_data.zip_download_url || 'N/A'}`);
      console.log(`    Gallery Assets:     ${v.delivery_data.gallery_images.length} images`);
    });

    console.log(`\n• Portfolio Items:     ${portfolioPages.length}`);
    portfolioPages.forEach(p => console.log(`  - [Portfolio] ${p.title} (${p.permalink})`));

    console.log('\n==================================================');
    console.log('  Ingestion completed successfully!               ');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n[x] Ingestion failed:', error.message);
    process.exit(1);
  }
}

runSync();
