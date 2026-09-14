<?php
/**
 * Graywood Block Theme — functions.php
 *
 * Enqueues styles, configures Gutenberg support, provides Nordic client
 * proofing password gates, and exposes REST API automation endpoints with CORS.
 *
 * @package Graywood
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Theme setup: support post thumbnails and editor styles.
 */
function graywood_theme_setup() {
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'editor-styles' );
    add_editor_style( 'assets/css/custom.css' );
}
add_action( 'after_setup_theme', 'graywood_theme_setup' );

/**
 * Enqueue custom frontend styles that extend theme.json.
 */
function graywood_enqueue_styles() {
    wp_enqueue_style(
        'graywood-custom',
        get_theme_file_uri( 'assets/css/custom.css' ),
        array(),
        wp_get_theme()->get( 'Version' )
    );
}
add_action( 'wp_enqueue_scripts', 'graywood_enqueue_styles' );

/**
 * Register block pattern categories specific to Graywood.
 */
function graywood_register_pattern_categories() {
    register_block_pattern_category( 'graywood-hero', array(
        'label' => __( 'Graywood Hero Sections', 'graywood' ),
    ) );
    register_block_pattern_category( 'graywood-cards', array(
        'label' => __( 'Graywood Cards & Pillars', 'graywood' ),
    ) );
}
add_action( 'init', 'graywood_register_pattern_categories' );

/**
 * Customize the password-protected form for the Client Delivery template.
 * Replaces the default WP password form with Graywood's Nordic styled version.
 */
function graywood_password_form( $output ) {
    global $post;

    $action = esc_url( site_url( 'wp-login.php?action=postpass', 'login_post' ) );

    $output = '
    <div class="gw-password-gate">
        <div class="gw-password-card">
            <div class="gw-password-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="gw-password-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
                <span>Private Proofing Vault</span>
            </div>
            <h2 class="gw-password-title">' . esc_html( get_the_title() ) . '</h2>
            <p class="gw-password-desc">This gallery is restricted to authorized clients. Enter your bespoke access password to view and download high-resolution proofs.</p>
            <form action="' . $action . '" method="post" class="gw-password-form">
                <label for="pwbox-' . $post->ID . '" class="gw-password-label">Security Access Password</label>
                <div class="gw-password-input-wrap">
                    <svg class="gw-password-key-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                    <input name="post_password" id="pwbox-' . $post->ID . '" type="password" required placeholder="Enter access password" class="gw-password-input" />
                </div>
                <button type="submit" class="gw-password-submit">
                    <span>Unlock Gallery</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
            <div class="gw-password-footer">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                <span>Encrypted Session · Zero-Discovery Protocol</span>
            </div>
        </div>
    </div>';

    return $output;
}
add_filter( 'the_password_form', 'graywood_password_form' );

/* =============================================================================
   REST API & Automation Pipeline
   ============================================================================= */

/**
 * Configure comprehensive CORS headers for REST API queries.
 */
function graywood_configure_rest_cors() {
    // Handle OPTIONS preflight requests before authentication runs
    if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE' );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Wpnonce, X-WP-Nonce, X-Requested-With' );
        header( 'Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, Link' );
        status_header( 200 );
        exit;
    }
}
add_action( 'init', 'graywood_configure_rest_cors', 1 );

/**
 * Append CORS headers to standard REST API responses.
 */
add_filter( 'rest_pre_serve_request', function( $served, $result, $request, $server ) {
    header( 'Access-Control-Allow-Origin: *' );
    header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE' );
    header( 'Access-Control-Allow-Credentials: true' );
    header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Wpnonce, X-WP-Nonce, X-Requested-With' );
    header( 'Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages, Link' );
    return $served;
}, 10, 4 );

/**
 * Register post meta for client delivery attributes so they are exposed in REST.
 */
function graywood_register_post_meta() {
    register_post_meta( 'page', '_zip_download_url', array(
        'show_in_rest'  => true,
        'single'        => true,
        'type'          => 'string',
        'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
    ) );

    register_post_meta( 'page', '_gw_client_download_url', array(
        'show_in_rest'  => true,
        'single'        => true,
        'type'          => 'string',
        'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
    ) );

    register_post_meta( 'page', '_gw_client_name', array(
        'show_in_rest'  => true,
        'single'        => true,
        'type'          => 'string',
        'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
    ) );
}
add_action( 'init', 'graywood_register_post_meta' );

/**
 * Helper to compute delivery data for a given post.
 */
function graywood_compute_delivery_data( $post_id ) {
    $post = get_post( $post_id );
    if ( ! $post ) {
        return array(
            'is_password_protected' => false,
            'zip_download_url'      => null,
            'gallery_images'        => array(),
        );
    }

    $is_protected = ( '' !== $post->post_password );

    // 1. ZIP Download URL resolution
    $download_url = get_post_meta( $post_id, '_zip_download_url', true );
    if ( empty( $download_url ) ) {
        $download_url = get_post_meta( $post_id, '_gw_client_download_url', true );
    }
    if ( empty( $download_url ) && ! empty( $post->post_content ) ) {
        if ( preg_match( '/href=["\']([^"\']+\.zip|[^"\']*download[^"\']*)["\']/i', $post->post_content, $matches ) ) {
            $download_url = $matches[1];
        }
    }

    // 2. Gallery Images extraction
    $gallery_images = array();
    if ( has_block( 'core/gallery', $post->post_content ) ) {
        $blocks = parse_blocks( $post->post_content );
        foreach ( $blocks as $block ) {
            if ( 'core/gallery' === $block['blockName'] ) {
                if ( ! empty( $block['attrs']['ids'] ) ) {
                    foreach ( $block['attrs']['ids'] as $img_id ) {
                        $url = wp_get_attachment_url( $img_id );
                        if ( $url ) {
                            $gallery_images[] = array(
                                'id'  => (int) $img_id,
                                'url' => esc_url_raw( $url ),
                            );
                        }
                    }
                }
                if ( ! empty( $block['innerBlocks'] ) ) {
                    foreach ( $block['innerBlocks'] as $inner ) {
                        if ( 'core/image' === $inner['blockName'] && ! empty( $inner['attrs']['id'] ) ) {
                            $img_id = (int) $inner['attrs']['id'];
                            $url = wp_get_attachment_url( $img_id );
                            if ( $url ) {
                                $gallery_images[] = array(
                                    'id'  => $img_id,
                                    'url' => esc_url_raw( $url ),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // Also check post attachment media
    if ( empty( $gallery_images ) ) {
        $attachments = get_posts( array(
            'post_parent'    => $post_id,
            'post_type'      => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => 20,
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ) );
        foreach ( $attachments as $att ) {
            $url = wp_get_attachment_url( $att->ID );
            if ( $url ) {
                $gallery_images[] = array(
                    'id'  => (int) $att->ID,
                    'url' => esc_url_raw( $url ),
                );
            }
        }
    }

    return array(
        'is_password_protected' => (bool) $is_protected,
        'zip_download_url'      => ! empty( $download_url ) ? esc_url_raw( $download_url ) : null,
        'gallery_images'        => $gallery_images,
    );
}

/**
 * Register the custom `delivery_data` and legacy `client_delivery` fields on posts and pages in WP REST API.
 */
function graywood_register_rest_fields() {
    // Official delivery_data field per specification
    register_rest_field(
        array( 'page', 'post' ),
        'delivery_data',
        array(
            'get_callback' => function( $post_arr ) {
                return graywood_compute_delivery_data( $post_arr['id'] );
            },
            'update_callback' => null,
            'schema'          => array(
                'description' => __( 'Client delivery metadata: password protection state, zip download URL, and gallery images.', 'graywood' ),
                'type'        => 'object',
            ),
        )
    );

    // Complementary client_delivery field for backwards compatibility
    register_rest_field(
        array( 'page', 'post' ),
        'client_delivery',
        array(
            'get_callback' => function( $post_arr ) {
                $post_id = $post_arr['id'];
                $post = get_post( $post_id );
                $data = graywood_compute_delivery_data( $post_id );
                $client_name = get_post_meta( $post_id, '_gw_client_name', true );
                if ( empty( $client_name ) && strpos( strtolower( $post ? $post->post_title : '' ), 'client' ) !== false ) {
                    $client_name = 'Private Client Vault';
                }
                return array(
                    'is_protected' => $data['is_password_protected'],
                    'download_url' => $data['zip_download_url'],
                    'client_name'  => ! empty( $client_name ) ? sanitize_text_field( $client_name ) : null,
                    'has_gallery'  => ! empty( $data['gallery_images'] ) || has_block( 'core/gallery', $post ? $post->post_content : '' ),
                    'template'     => get_page_template_slug( $post_id ) ?: 'default',
                    'content_type' => $data['is_password_protected'] ? 'encrypted_proofs' : 'public_editorial',
                );
            },
            'update_callback' => null,
            'schema'          => array(
                'description' => __( 'Client delivery extended attributes.', 'graywood' ),
                'type'        => 'object',
            ),
        )
    );

    // Direct featured image URL helper for frontend consumers
    register_rest_field(
        array( 'page', 'post' ),
        'featured_image_url',
        array(
            'get_callback' => function( $post_arr ) {
                $image_id = get_post_thumbnail_id( $post_arr['id'] );
                if ( ! $image_id ) {
                    return null;
                }
                return wp_get_attachment_image_url( $image_id, 'full' );
            },
            'schema' => array(
                'description' => __( 'Direct URL of the featured image (full resolution).', 'graywood' ),
                'type'        => array( 'string', 'null' ),
            ),
        )
    );
}
add_action( 'rest_api_init', 'graywood_register_rest_fields' );

/**
 * Write a timestamped JSON payload to sync-trigger.json whenever content changes.
 */
function graywood_trigger_content_sync( $post_id, $post = null, $update = null ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( wp_is_post_revision( $post_id ) ) {
        return;
    }

    $payload = json_encode( array(
        'last_updated' => current_time( 'mysql' ),
        'timestamp'    => time(),
        'post_id'      => (int) $post_id,
        'post_title'   => $post ? $post->post_title : '',
    ), JSON_PRETTY_PRINT );

    // Docker path
    $docker_dir = '/var/www/html/wp-content';
    if ( is_dir( $docker_dir ) && is_writable( $docker_dir ) ) {
        @file_put_contents( $docker_dir . '/sync-trigger.json', $payload );
    }

    // Local / standard WP_CONTENT_DIR path
    if ( defined( 'WP_CONTENT_DIR' ) && is_dir( WP_CONTENT_DIR ) ) {
        @file_put_contents( WP_CONTENT_DIR . '/sync-trigger.json', $payload );
    }
}
add_action( 'save_post', 'graywood_trigger_content_sync', 10, 3 );
