/**
 * Graywood WordPress Content Sync Client
 *
 * Dynamically fetches and parses pages, portfolio items, client deliveries,
 * and media from the WordPress REST API into a cached JSON content store.
 */

const fs = require('fs');
const path = require('path');

const WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8080';
const OUTPUT_FILE = path.join(__dirname, 'cached-content.json');

async function fetchFromWP(endpoint) {
  const url = `${WP_BASE_URL}/wp-json/wp/v2/${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error from WordPress (${res.status} ${res.statusText}) at ${url}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[sync-wordpress] Failed to fetch ${url}:`, err.message);
    throw err;
  }
}

function parseFeaturedImage(item) {
  if (item.featured_image_url) {
    return item.featured_image_url;
  }
  if (item._embedded && item._embedded['wp:featuredmedia'] && item._embedded['wp:featuredmedia'][0]) {
    const media = item._embedded['wp:featuredmedia'][0];
    return media.source_url || media.media_details?.sizes?.full?.source_url || null;
  }
  return null;
}

async function sync() {
  console.log('==================================================');
  console.log('  Graywood Content Delivery Automation Pipeline   ');
  console.log('==================================================');
  console.log(`Connecting to WordPress REST API at: ${WP_BASE_URL}\n`);

  try {
    // 1. Fetch all published pages and posts with embedded media
    const [pagesRaw, postsRaw] = await Promise.all([
      fetchFromWP('pages?_embed&per_page=100&status=publish'),
      fetchFromWP('posts?_embed&per_page=100&status=publish').catch(() => []),
    ]);

    console.log(`[✓] Fetched ${pagesRaw.length} pages from WordPress.`);
    console.log(`[✓] Fetched ${postsRaw.length} posts from WordPress.`);

    // 2. Normalize Pages
    const pages = pagesRaw.map(page => ({
      id: page.id,
      slug: page.slug,
      title: page.title?.rendered || '',
      url: page.link,
      template: page.template || 'default',
      modified: page.modified,
      featured_image: parseFeaturedImage(page),
      client_delivery: page.client_delivery || {
        is_protected: page.content?.protected || false,
        download_url: null,
        client_name: null,
        has_gallery: false,
        content_type: 'public_editorial',
      },
    }));

    // 3. Extract Client Delivery Proofing Vaults
    const clientDeliveries = pages
      .filter(p => p.client_delivery.is_protected || p.template === 'page-client-delivery' || p.slug === 'client-deliveries')
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        vault_url: p.url,
        is_protected: p.client_delivery.is_protected,
        client_name: p.client_delivery.client_name || 'Client Proofing Vault',
        download_url: p.client_delivery.download_url,
        has_gallery: p.client_delivery.has_gallery,
        content_type: p.client_delivery.content_type,
      }));

    // 4. Extract Portfolio / Showcase Content
    const portfolio = pages
      .filter(p => p.slug === 'portfolio' || p.slug === 'home' || p.slug.includes('portfolio'))
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        url: p.url,
        featured_image: p.featured_image,
      }));

    // 5. Normalize Posts
    const posts = postsRaw.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title?.rendered || '',
      url: post.link,
      date: post.date,
      excerpt: post.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || '',
      featured_image: parseFeaturedImage(post),
      client_delivery: post.client_delivery || null,
    }));

    // 6. Build Content Manifest
    const contentStore = {
      synced_at: new Date().toISOString(),
      source: WP_BASE_URL,
      stats: {
        total_pages: pages.length,
        total_posts: posts.length,
        total_client_vaults: clientDeliveries.length,
        total_portfolio_sections: portfolio.length,
      },
      client_deliveries: clientDeliveries,
      portfolio: portfolio,
      pages: pages,
      posts: posts,
    };

    // 7. Write to cached-content.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contentStore, null, 2), 'utf8');

    console.log(`\n[✓] Successfully generated: ${OUTPUT_FILE}`);
    console.log('\n--- Synchronized Content Summary ---');
    console.log(`• Client Deliveries: ${clientDeliveries.length}`);
    clientDeliveries.forEach(cd => {
      console.log(`  - [Vault] ${cd.title} (${cd.vault_url})`);
      console.log(`    Protected: ${cd.is_protected ? 'YES (Encrypted)' : 'NO'}`);
      console.log(`    Client:    ${cd.client_name}`);
      console.log(`    Download:  ${cd.download_url || 'N/A'}`);
    });

    console.log(`\n• Portfolio Items:   ${portfolio.length}`);
    portfolio.forEach(pt => console.log(`  - [Portfolio] ${pt.title} (${pt.slug})`));

    console.log(`\n• Total Pages:       ${pages.length}`);
    console.log(`• Total Posts:       ${posts.length}`);
    console.log('\n==================================================');
    console.log('  Content synchronization complete!               ');
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n[x] Content synchronization failed:', error.message);
    process.exit(1);
  }
}

sync();
