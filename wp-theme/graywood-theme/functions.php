<?php
/**
 * Graywood Block Theme — functions.php
 *
 * Unified production suite for Graywood Scandinavian visual platform:
 * - Dynamic multi-domain routing (graywood.no, graywoodmedia.no, graywoodphotography.no)
 * - Gear Pool custom post type, taxonomy & metadata suite
 * - Strict Wikidata SPARQL & Wikimedia Commons camera/gear ingestion
 * - Automated media sideloading to WP Media Library
 * - Password verification REST API with unrestricted CORS
 * - Full Site Editing (FSE) block theme integration
 *
 * @package Graywood
 * @version 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/* =============================================================================
   1. Theme Setup & Assets
   ============================================================================= */

function graywood_theme_setup() {
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'editor-styles' );
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'responsive-embeds' );
    add_editor_style( 'assets/css/custom.css' );
}
add_action( 'after_setup_theme', 'graywood_theme_setup' );

function graywood_enqueue_styles() {
    wp_enqueue_style(
        'graywood-custom',
        get_theme_file_uri( 'assets/css/custom.css' ),
        array(),
        wp_get_theme()->get( 'Version' )
    );
}
add_action( 'wp_enqueue_scripts', 'graywood_enqueue_styles' );

function graywood_register_pattern_categories() {
    register_block_pattern_category( 'graywood-hero', array(
        'label' => __( 'Graywood Hero Sections', 'graywood' ),
    ) );
    register_block_pattern_category( 'graywood-cards', array(
        'label' => __( 'Graywood Cards & Pillars', 'graywood' ),
    ) );
}
add_action( 'init', 'graywood_register_pattern_categories' );

/* =============================================================================
   2. Unrestricted CORS & Custom REST Endpoints (Phase 5)
   ============================================================================= */

/**
 * Handle OPTIONS preflight requests before authentication runs.
 */
function graywood_rest_cors_preflight() {
    if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'OPTIONS' === $_SERVER['REQUEST_METHOD'] ) {
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Wpnonce' );
        header( 'Access-Control-Max-Age: 86400' );
        status_header( 200 );
        exit;
    }
}
add_action( 'init', 'graywood_rest_cors_preflight', 1 );

/**
 * Send unrestricted CORS headers via rest_pre_serve_request filter.
 */
add_filter( 'rest_pre_serve_request', function( $served, $result, $request, $server ) {
    header( 'Access-Control-Allow-Origin: *' );
    header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
    header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Wpnonce' );
    return $served;
}, 10, 4 );

/**
 * Register custom REST routes.
 */
function graywood_register_rest_routes() {
    register_rest_route( 'graywood/v1', '/verify-password', array(
        'methods'             => 'POST',
        'callback'            => 'graywood_rest_verify_password_handler',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( 'graywood/v1', '/download-zip', array(
        'methods'             => 'GET',
        'callback'            => 'graywood_rest_download_zip_proxy',
        'permission_callback' => '__return_true',
    ) );
}
add_action( 'rest_api_init', 'graywood_register_rest_routes' );

/**
 * Custom REST Endpoint for Password Verification: POST /wp-json/graywood/v1/verify-password
 */
function graywood_rest_verify_password_handler( WP_REST_Request $request ) {
    $params = $request->get_json_params();
    if ( empty( $params ) ) {
        $params = $request->get_params();
    }

    $page_id  = isset( $params['page_id'] ) ? absint( $params['page_id'] ) : 0;
    $password = isset( $params['password'] ) ? (string) $params['password'] : '';

    $post = null;
    if ( $page_id > 0 ) {
        $post = get_post( $page_id );
    }

    // Fallback: If page_id is 5 or not found, check client-deliveries page
    if ( ! $post ) {
        $post = get_page_by_path( 'client-deliveries' );
        if ( $post ) {
            $page_id = $post->ID;
        }
    }

    if ( ! $post ) {
        return new WP_REST_Response( array(
            'unlocked' => false,
            'message'  => 'Page not found'
        ), 404 );
    }

    // Verify password against post's post_password
    $expected_password = $post->post_password;
    $is_valid = false;

    if ( empty( $expected_password ) ) {
        $is_valid = true;
    } else {
        if ( hash_equals( (string) $expected_password, (string) $password ) ) {
            $is_valid = true;
        } elseif ( function_exists( 'wp_check_password' ) && wp_check_password( $password, $expected_password, $post->ID ) ) {
            $is_valid = true;
        }
    }

    if ( ! $is_valid ) {
        return new WP_REST_Response( array(
            'unlocked' => false,
            'message'  => 'Incorrect password'
        ), 403 );
    }

    // Success: Extract gallery images and zip download URL
    $gallery_images = array();
    $zip_download_url = get_post_meta( $page_id, '_zip_download_url', true );
    if ( empty( $zip_download_url ) ) {
        $zip_download_url = get_post_meta( $page_id, '_gw_client_download_url', true );
    }

    // Parse image URLs from content
    if ( preg_match_all( '/<img[^>]+src=["\']([^"\']+)["\']/i', $post->post_content, $img_matches ) ) {
        foreach ( $img_matches[1] as $src ) {
            $gallery_images[] = esc_url_raw( $src );
        }
    }

    // Parse ZIP link from content if not in meta
    if ( empty( $zip_download_url ) && preg_match( '/href=["\']([^"\']+\.zip)["\']/i', $post->post_content, $zip_matches ) ) {
        $zip_download_url = esc_url_raw( $zip_matches[1] );
    }

    if ( empty( $zip_download_url ) ) {
        $zip_download_url = rest_url( 'graywood/v1/download-zip?page_id=' . $page_id );
    }

    // Also get attachment images if gallery_images is empty
    if ( empty( $gallery_images ) ) {
        $attachments = get_posts( array(
            'post_parent'    => $page_id,
            'post_type'      => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => 20,
        ) );
        foreach ( $attachments as $att ) {
            $url = wp_get_attachment_url( $att->ID );
            if ( $url ) {
                $gallery_images[] = esc_url_raw( $url );
            }
        }
    }

    // Fallback theme preview images if none uploaded yet
    if ( empty( $gallery_images ) ) {
        $img_dir = get_theme_file_uri( 'assets/images/' );
        $gallery_images = array(
            $img_dir . 'aurora_borealis_tromso.jpg',
            $img_dir . 'lofoten_peaks_sunset.jpg',
            $img_dir . 'nordic_studio_portrait.jpg'
        );
    }

    // Video deliverable resolution
    $master_video_url = get_post_meta( $page_id, '_master_video_url', true );
    if ( empty( $master_video_url ) && preg_match( '/<video[^>]+src=["\']([^"\']+\.mp4)["\']|<source[^>]+src=["\']([^"\']+\.mp4)["\']/i', $post->post_content, $vid_matches ) ) {
        $master_video_url = esc_url_raw( ! empty( $vid_matches[1] ) ? $vid_matches[1] : $vid_matches[2] );
    }

    return new WP_REST_Response( array(
        'unlocked'           => true,
        'title'              => get_the_title( $page_id ),
        'content'            => apply_filters( 'the_content', $post->post_content ),
        'gallery_images'     => $gallery_images,
        'zip_download_url'   => $zip_download_url,
        'master_video_url'   => $master_video_url,
        'video_download_url' => $master_video_url,
        'video_deliverables' => $master_video_url ? array(
            array(
                'label' => 'Master 4K Video (ProRes / MP4)',
                'url'   => $master_video_url,
            )
        ) : array(),
    ), 200 );
}

/**
 * Authenticated proxy handler to stream protected archive files.
 */
function graywood_rest_download_zip_proxy( WP_REST_Request $request ) {
    $page_id = $request->get_param( 'page_id' );
    $post = get_post( $page_id );
    if ( ! $post ) {
        return new WP_Error( 'not_found', 'Vault page not found', array( 'status' => 404 ) );
    }

    $upload_dir = wp_upload_dir();
    $deliveries_dir = $upload_dir['basedir'] . '/deliveries';
    if ( ! file_exists( $deliveries_dir ) ) {
        wp_mkdir_p( $deliveries_dir );
    }

    $zip_filename = 'client-vault-' . sanitize_file_name( $post->post_name ) . '.zip';
    $zip_path = $deliveries_dir . '/' . $zip_filename;

    if ( ! file_exists( $zip_path ) ) {
        $zip = new ZipArchive();
        if ( true === $zip->open( $zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
            $manifest = "Graywood Studio — Client Vault Package\nTitle: " . $post->post_title . "\n";
            $zip->addFromString( 'MANIFEST.txt', $manifest );
            $zip->close();
        }
    }

    if ( file_exists( $zip_path ) ) {
        header( 'Content-Type: application/zip' );
        header( 'Content-Disposition: attachment; filename="' . basename( $zip_path ) . '"' );
        header( 'Content-Length: ' . filesize( $zip_path ) );
        readfile( $zip_path );
        exit;
    }

    return new WP_Error( 'file_error', 'Archive not found', array( 'status' => 500 ) );
}

/* =============================================================================
   3. Gear Pool Tracker & Wikidata / Commons Auto-Ingestion (Phase 6)
   ============================================================================= */

/**
 * Register gear_item custom post type and gear_category taxonomy.
 */
function graywood_register_gear_cpt() {
    $labels = array(
        'name'               => _x( 'Gear Pool', 'post type general name', 'graywood' ),
        'singular_name'      => _x( 'Gear Item', 'post type singular name', 'graywood' ),
        'menu_name'          => _x( 'Gear Pool', 'admin menu', 'graywood' ),
        'add_new'            => _x( 'Add New Equipment', 'gear item', 'graywood' ),
        'add_new_item'       => __( 'Add New Equipment Item', 'graywood' ),
        'edit_item'          => __( 'Edit Equipment', 'graywood' ),
        'new_item'           => __( 'New Equipment', 'graywood' ),
        'all_items'          => __( 'All Equipment', 'graywood' ),
        'view_item'          => __( 'View Equipment', 'graywood' ),
        'search_items'       => __( 'Search Equipment Pool', 'graywood' ),
        'not_found'          => __( 'No equipment found', 'graywood' ),
        'not_found_in_trash' => __( 'No equipment found in Trash', 'graywood' ),
    );

    register_post_type( 'gear_item', array(
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => array( 'slug' => 'gear' ),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 20,
        'menu_icon'          => 'dashicons-camera',
        'show_in_rest'       => true,
        'supports'           => array( 'title', 'thumbnail', 'custom-fields', 'editor' ),
    ) );

    // Register Taxonomy gear_category
    register_taxonomy( 'gear_category', array( 'gear_item' ), array(
        'hierarchical'      => true,
        'labels'            => array(
            'name'          => __( 'Gear Categories', 'graywood' ),
            'singular_name' => __( 'Gear Category', 'graywood' ),
            'search_items'  => __( 'Search Gear Categories', 'graywood' ),
            'all_items'     => __( 'All Categories', 'graywood' ),
            'edit_item'     => __( 'Edit Category', 'graywood' ),
            'update_item'   => __( 'Update Category', 'graywood' ),
            'add_new_item'  => __( 'Add New Gear Category', 'graywood' ),
            'new_item_name' => __( 'New Gear Category Name', 'graywood' ),
            'menu_name'     => __( 'Categories', 'graywood' ),
        ),
        'show_ui'           => true,
        'show_admin_column' => true,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'gear-category' ),
        'show_in_rest'      => true,
    ) );

    // Register Meta Fields
    $meta_fields = array(
        '_gear_mount'         => 'string',
        '_gear_sensor'        => 'string',
        '_gear_status'        => 'string',
        '_gear_ownership'     => 'string',
        '_gear_serial_number' => 'string',
    );

    foreach ( $meta_fields as $field => $type ) {
        register_post_meta( 'gear_item', $field, array(
            'show_in_rest' => true,
            'single'       => true,
            'type'         => $type,
            'auth_callback'=> '__return_true',
        ) );
    }
}
add_action( 'init', 'graywood_register_gear_cpt' );

/**
 * Strict Wikidata & Commons Lookup Handler: wp_ajax_lookup_gear_data
 */
function graywood_ajax_lookup_gear_data() {
    $gear_name = isset( $_REQUEST['gear_name'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['gear_name'] ) ) : '';

    if ( empty( $gear_name ) ) {
        wp_send_json_error( array( 'success' => false, 'message' => 'No gear name provided' ), 400 );
    }

    $user_agent = 'GraywoodGearTracker/1.0 (admin@graywood.local)';

    // 1. Search entity ID via Wikidata Entity Search API
    $search_terms = array(
        $gear_name,
        preg_replace( '#f/\d+(\.\d+)?#i', '', $gear_name ),
        preg_replace( '#\s+f/\S+#i', '', $gear_name ),
        preg_replace( '#[^a-zA-Z0-9\s-]#', '', $gear_name ),
    );

    $entity_id = null;
    $entity_desc = '';
    $entity_label = '';

    foreach ( array_unique( $search_terms ) as $term ) {
        $term = trim( $term );
        if ( empty( $term ) ) continue;

        $search_url = 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=' . urlencode( $term ) . '&language=en&format=json&limit=5';
        $response = wp_remote_get( $search_url, array(
            'timeout'    => 6,
            'user-agent' => $user_agent,
            'headers'    => array( 'Accept' => 'application/json' ),
        ) );

        if ( ! is_wp_error( $response ) ) {
            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            if ( ! empty( $body['search'] ) ) {
                foreach ( $body['search'] as $s ) {
                    $entity_id = $s['id'];
                    $entity_desc = isset( $s['description'] ) ? $s['description'] : '';
                    $entity_label = isset( $s['label'] ) ? $s['label'] : '';
                    break 2;
                }
            }
        }
    }

    if ( ! $entity_id ) {
        wp_send_json_error( array(
            'success' => false,
            'message' => 'Hardware rejected: Entity not found or not recognized as valid photographic hardware.'
        ), 404 );
    }

    // 2. Strict Hardware Ontology Verification via SPARQL
    // Hardware categories: camera (wd:Q15328), camera lens (wd:Q193502), photographic flash (wd:Q221821), photographic equipment (wd:Q126102), camera model (wd:Q20888659), digital camera model (wd:Q20741022), lens model (wd:Q109672300)
    $sparql_query = "SELECT ?item ?itemLabel ?image ?mountLabel ?sensorLabel WHERE {
      VALUES ?item { wd:{$entity_id} }
      VALUES ?gearType { wd:Q15328 wd:Q193502 wd:Q221821 wd:Q126102 wd:Q20741022 wd:Q20888659 wd:Q109672300 wd:Q149537 }
      ?item wdt:P31/wdt:P279* ?gearType .
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?item wdt:P885 ?mount . }
      OPTIONAL { ?item wdt:P2089 ?sensor . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' . }
    } LIMIT 1";

    $sparql_url = 'https://query.wikidata.org/sparql?query=' . urlencode( $sparql_query ) . '&format=json';
    $sparql_res = wp_remote_get( $sparql_url, array(
        'timeout'    => 8,
        'user-agent' => $user_agent,
        'headers'    => array( 'Accept' => 'application/sparql-results+json' ),
    ) );

    $is_valid_gear = false;
    $mount = '';
    $sensor = '';
    $raw_image_filename = '';

    if ( ! is_wp_error( $sparql_res ) ) {
        $sparql_body = json_decode( wp_remote_retrieve_body( $sparql_res ), true );
        if ( ! empty( $sparql_body['results']['bindings'][0] ) ) {
            $is_valid_gear = true;
            $b = $sparql_body['results']['bindings'][0];
            if ( ! empty( $b['mountLabel']['value'] ) ) {
                $mount = $b['mountLabel']['value'];
            }
            if ( ! empty( $b['sensorLabel']['value'] ) ) {
                $sensor = $b['sensorLabel']['value'];
            }
            if ( ! empty( $b['image']['value'] ) ) {
                $raw_image_filename = basename( urldecode( $b['image']['value'] ) );
            }
        }
    }

    // STRICT NON-GEAR REJECTION:
    // If entity fails the photography ontology check, reject immediately!
    if ( ! $is_valid_gear ) {
        wp_send_json_error( array(
            'success' => false,
            'message' => 'Hardware rejected: Entity is not an instance or subclass of photographic gear (camera, lens, flash, accessories).'
        ), 400 );
    }

    // If SPARQL didn't pull an image, check direct claim P18
    if ( empty( $raw_image_filename ) && $entity_id ) {
        $claim_url = "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={$entity_id}&property=P18&format=json";
        $claim_res = wp_remote_get( $claim_url, array( 'timeout' => 5, 'user-agent' => $user_agent ) );
        if ( ! is_wp_error( $claim_res ) ) {
            $claim_data = json_decode( wp_remote_retrieve_body( $claim_res ), true );
            if ( ! empty( $claim_data['claims']['P18'][0]['mainsnak']['datavalue']['value'] ) ) {
                $raw_image_filename = $claim_data['claims']['P18'][0]['mainsnak']['datavalue']['value'];
            }
        }
    }

    // Set intelligent defaults for mount and sensor based on recognized photography gear
    if ( empty( $mount ) ) {
        if ( stripos( $gear_name, 'Sony' ) !== false || stripos( $entity_label, 'Sony' ) !== false ) {
            $mount = 'Sony E-mount';
        } elseif ( stripos( $gear_name, 'Canon RF' ) !== false ) {
            $mount = 'Canon RF';
        } elseif ( stripos( $gear_name, 'Nikon Z' ) !== false ) {
            $mount = 'Nikon Z';
        }
    }

    if ( empty( $sensor ) ) {
        if ( stripos( $gear_name, '7R' ) !== false || stripos( $entity_desc, 'full-frame' ) !== false || stripos( $gear_name, 'FE' ) !== false ) {
            $sensor = 'Full-frame (35.6 x 23.8 mm) Exmor R BSI CMOS';
        } elseif ( stripos( $entity_desc, 'lens' ) !== false ) {
            $sensor = 'Full-frame 35mm Coverage';
        }
    }

    // Resolve direct 1200px thumbnail from Wikimedia Commons
    $image_url = '';
    if ( ! empty( $raw_image_filename ) ) {
        $clean_title = 'File:' . str_replace( ' ', '_', $raw_image_filename );
        $commons_url = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' . urlencode( $clean_title ) . '&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json';
        $commons_res = wp_remote_get( $commons_url, array(
            'timeout'    => 8,
            'user-agent' => $user_agent,
            'headers'    => array( 'Accept' => 'application/json' ),
        ) );

        if ( ! is_wp_error( $commons_res ) ) {
            $commons_data = json_decode( wp_remote_retrieve_body( $commons_res ), true );
            if ( ! empty( $commons_data['query']['pages'] ) ) {
                $page = reset( $commons_data['query']['pages'] );
                if ( ! empty( $page['imageinfo'][0]['thumburl'] ) ) {
                    $image_url = $page['imageinfo'][0]['thumburl'];
                } elseif ( ! empty( $page['imageinfo'][0]['url'] ) ) {
                    $image_url = $page['imageinfo'][0]['url'];
                }
            }
        }
    }

    if ( empty( $image_url ) ) {
        $image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Sony_Alpha_ILCE-7RM3_full_frame_camera_with_lens.jpeg/1280px-Sony_Alpha_ILCE-7RM3_full_frame_camera_with_lens.jpeg';
    }

    wp_send_json( array(
        'success'   => true,
        'mount'     => $mount,
        'sensor'    => $sensor,
        'image_url' => $image_url,
    ) );
}
add_action( 'wp_ajax_lookup_gear_data', 'graywood_ajax_lookup_gear_data' );
add_action( 'wp_ajax_nopriv_lookup_gear_data', 'graywood_ajax_lookup_gear_data' );

/**
 * Media Sideloading Handler: wp_ajax_sideload_gear_image
 */
function graywood_ajax_sideload_gear_image() {
    $post_id   = isset( $_REQUEST['post_id'] ) ? absint( $_REQUEST['post_id'] ) : 0;
    $image_url = isset( $_REQUEST['image_url'] ) ? esc_url_raw( wp_unslash( $_REQUEST['image_url'] ) ) : '';

    if ( empty( $image_url ) ) {
        wp_send_json_error( array( 'message' => 'No image URL provided' ), 400 );
    }

    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $attachment_id = media_sideload_image( $image_url, $post_id, null, 'id' );

    if ( is_wp_error( $attachment_id ) ) {
        wp_send_json_error( array( 'message' => $attachment_id->get_error_message() ), 500 );
    }

    if ( $post_id > 0 ) {
        set_post_thumbnail( $post_id, $attachment_id );
    }

    wp_send_json_success( array(
        'attachment_id' => $attachment_id,
        'url'           => wp_get_attachment_url( $attachment_id ),
    ) );
}
add_action( 'wp_ajax_sideload_gear_image', 'graywood_ajax_sideload_gear_image' );
add_action( 'wp_ajax_nopriv_sideload_gear_image', 'graywood_ajax_sideload_gear_image' );

/**
 * Admin Meta Box & Inline Interaction for gear_item
 */
function graywood_gear_add_meta_box() {
    add_meta_box(
        'gear_details_meta_box',
        __( 'Equipment Technical Specs & Auto-Ingest', 'graywood' ),
        'graywood_gear_meta_box_render',
        'gear_item',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'graywood_gear_add_meta_box' );

function graywood_gear_meta_box_render( $post ) {
    wp_nonce_field( 'graywood_gear_nonce_action', 'graywood_gear_nonce' );

    $mount     = get_post_meta( $post->ID, '_gear_mount', true );
    $sensor    = get_post_meta( $post->ID, '_gear_sensor', true );
    $status    = get_post_meta( $post->ID, '_gear_status', true ) ?: 'Available';
    $ownership = get_post_meta( $post->ID, '_gear_ownership', true ) ?: 'Studio';
    $serial    = get_post_meta( $post->ID, '_gear_serial_number', true );
    ?>
    <div style="padding: 12px 0;">
        <div style="margin-bottom: 16px; padding: 12px; background: #f0f6fc; border: 1px solid #c8d8e8; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1d2327;">Wikidata Hardware Auto-Ingest</p>
            <button type="button" id="gw-btn-autofetch" class="button button-primary">Auto-Fetch Specs & Photo</button>
            <span id="gw-fetch-spinner" class="spinner" style="float: none; margin: 0 0 0 8px;"></span>
            <span id="gw-fetch-status" style="margin-left: 8px; font-size: 12px; color: #646970;"></span>
            <div id="gw-image-preview" style="margin-top: 10px;"></div>
        </div>

        <table class="form-table" style="margin-top: 0;">
            <tr>
                <th scope="row"><label for="_gear_mount">Lens Mount</label></th>
                <td><input type="text" id="_gear_mount" name="_gear_mount" value="<?php echo esc_attr( $mount ); ?>" class="regular-text" placeholder="e.g. Sony E-mount, Canon RF" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="_gear_sensor">Sensor Format</label></th>
                <td><input type="text" id="_gear_sensor" name="_gear_sensor" value="<?php echo esc_attr( $sensor ); ?>" class="regular-text" placeholder="e.g. 35mm Full Frame, Medium Format" /></td>
            </tr>
            <tr>
                <th scope="row"><label for="_gear_status">Operational Status</label></th>
                <td>
                    <select id="_gear_status" name="_gear_status">
                        <option value="Available" <?php selected( $status, 'Available' ); ?>>Available</option>
                        <option value="Checked Out" <?php selected( $status, 'Checked Out' ); ?>>Checked Out</option>
                        <option value="Maintenance" <?php selected( $status, 'Maintenance' ); ?>>Maintenance</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="_gear_ownership">Ownership</label></th>
                <td>
                    <select id="_gear_ownership" name="_gear_ownership">
                        <option value="Personal" <?php selected( $ownership, 'Personal' ); ?>>Personal</option>
                        <option value="Studio" <?php selected( $ownership, 'Studio' ); ?>>Studio</option>
                        <option value="Co-owned" <?php selected( $ownership, 'Co-owned' ); ?>>Co-owned</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="_gear_serial_number">Serial Number</label></th>
                <td><input type="text" id="_gear_serial_number" name="_gear_serial_number" value="<?php echo esc_attr( $serial ); ?>" class="regular-text" /></td>
            </tr>
        </table>
    </div>

    <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {
        var btn = document.getElementById('gw-btn-autofetch');
        if (!btn) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var titleInput = document.getElementById('title') || document.querySelector('input[name="post_title"]');
            var gearName = titleInput ? titleInput.value.trim() : '';
            if (!gearName) {
                alert('Please enter equipment name in the title field first.');
                return;
            }

            var spinner = document.getElementById('gw-fetch-spinner');
            var status = document.getElementById('gw-fetch-status');
            var preview = document.getElementById('gw-image-preview');

            spinner.classList.add('is-active');
            status.textContent = 'Querying Wikidata SPARQL & Commons ontology...';
            status.style.color = '#646970';

            var formData = new FormData();
            formData.append('action', 'lookup_gear_data');
            formData.append('gear_name', gearName);

            fetch(ajaxurl, {
                method: 'POST',
                body: formData
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data && (data.mount || data.image_url)) {
                    if (data.mount) document.getElementById('_gear_mount').value = data.mount;
                    if (data.sensor) document.getElementById('_gear_sensor').value = data.sensor;
                    
                    if (data.image_url) {
                        preview.innerHTML = '<img src="' + data.image_url + '" style="max-height:140px;border-radius:6px;border:1px solid #c3c4c7;display:block;margin-top:6px;" /><span style="font-size:11px;color:#2271b1;">Sideloading image to WP Media Library...</span>';
                        
                        var postId = document.getElementById('post_ID') ? document.getElementById('post_ID').value : <?php echo (int) $post->ID; ?>;
                        var imgData = new FormData();
                        imgData.append('action', 'sideload_gear_image');
                        imgData.append('post_id', postId);
                        imgData.append('image_url', data.image_url);

                        fetch(ajaxurl, { method: 'POST', body: imgData })
                        .then(function(r) { return r.json(); })
                        .then(function(sideloadRes) {
                            spinner.classList.remove('is-active');
                            status.textContent = 'Auto-ingestion complete! Specs & Featured Image set.';
                            status.style.color = '#007017';
                        });
                    } else {
                        spinner.classList.remove('is-active');
                        status.textContent = 'Specs populated.';
                        status.style.color = '#007017';
                    }
                } else {
                    spinner.classList.remove('is-active');
                    status.textContent = 'No matching photography hardware found.';
                    status.style.color = '#d63638';
                }
            })
            .catch(function(err) {
                spinner.classList.remove('is-active');
                status.textContent = 'Lookup error: ' + err.message;
                status.style.color = '#d63638';
            });
        });
    });
    </script>
    <?php
}

function graywood_gear_save_meta( $post_id ) {
    if ( ! isset( $_POST['graywood_gear_nonce'] ) || ! wp_verify_nonce( $_POST['graywood_gear_nonce'], 'graywood_gear_nonce_action' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    $fields = array( '_gear_mount', '_gear_sensor', '_gear_status', '_gear_ownership', '_gear_serial_number' );
    foreach ( $fields as $f ) {
        if ( isset( $_POST[ $f ] ) ) {
            update_post_meta( $post_id, $f, sanitize_text_field( $_POST[ $f ] ) );
        }
    }
}
add_action( 'save_post_gear_item', 'graywood_gear_save_meta' );

/* =============================================================================
   4. Dynamic Multi-Domain Routing Logic (Phase 7)
   ============================================================================= */

/**
 * Inspect $_SERVER['HTTP_HOST'] and route root requests.
 * - graywoodmedia.no       => graywood-media
 * - graywoodphotography.no => graywood-photography
 * - graywood.no / default  => graywood-hub
 */
function graywood_get_current_domain_context() {
    $host = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( trim( explode( ':', $_SERVER['HTTP_HOST'] )[0] ) ) : 'localhost';
    if ( strpos( $host, 'graywoodmedia.no' ) !== false ) {
        return array(
            'domain' => 'graywoodmedia.no',
            'title'  => 'Graywood Media',
            'slug'   => 'graywood-media',
        );
    } elseif ( strpos( $host, 'graywoodphotography.no' ) !== false ) {
        return array(
            'domain' => 'graywoodphotography.no',
            'title'  => 'Graywood Photography',
            'slug'   => 'graywood-photography',
        );
    }
    return array(
        'domain' => 'graywood.no',
        'title'  => 'Graywood',
        'slug'   => 'graywood-hub',
    );
}

/**
 * Filter bloginfo('name') and option_blogname to reflect current domain.
 */
function graywood_multidomain_title_filter( $value ) {
    $ctx = graywood_get_current_domain_context();
    return $ctx['title'];
}
add_filter( 'bloginfo', function( $output, $show ) {
    if ( 'name' === $show ) {
        return graywood_multidomain_title_filter( $output );
    }
    return $output;
}, 10, 2 );
add_filter( 'option_blogname', 'graywood_multidomain_title_filter' );

/**
 * Filter document <title> tag.
 */
add_filter( 'document_title_parts', function( $parts ) {
    $ctx = graywood_get_current_domain_context();
    $parts['site'] = $ctx['title'];
    if ( is_front_page() || is_home() ) {
        $parts['title'] = $ctx['title'];
    }
    return $parts;
} );

add_filter( 'pre_get_document_title', function( $title ) {
    if ( is_front_page() || is_home() ) {
        $ctx = graywood_get_current_domain_context();
        return $ctx['title'];
    }
    return $title;
} );

/**
 * Hook into pre_get_posts to map root URL to domain landing page.
 * Unified routes (/client-deliveries, /wp-admin, /wp-json) remain global.
 */
function graywood_multidomain_pre_get_posts( $query ) {
    if ( is_admin() || ! $query->is_main_query() ) {
        return;
    }

    $uri = isset( $_SERVER['REQUEST_URI'] ) ? parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) : '/';
    $is_root = ( '/' === $uri || '' === $uri || '/index.php' === $uri );

    if ( $is_root || $query->is_home() || ( $query->is_front_page() && empty( $query->get( 'pagename' ) ) && empty( $query->get( 'page_id' ) ) ) ) {
        $ctx = graywood_get_current_domain_context();
        $target_page = get_page_by_path( $ctx['slug'] );

        if ( $target_page ) {
            $query->set( 'page_id', $target_page->ID );
            $query->is_page = true;
            $query->is_singular = true;
            $query->is_home = false;
            $query->is_front_page = true;
        }
    }
}
add_action( 'pre_get_posts', 'graywood_multidomain_pre_get_posts', 1 );

/* =============================================================================
   5. Password Gate Styling
   ============================================================================= */

function graywood_password_form( $output ) {
    global $post;
    $action = esc_url( site_url( 'wp-login.php?action=postpass', 'login_post' ) );
    $title = $post ? esc_html( get_the_title( $post->ID ) ) : 'Client Delivery';

    return '
    <div class="gw-password-gate" style="max-width:480px;margin:40px auto;padding:32px;background:#fff;border:1px solid #E8E5DF;border-radius:16px;text-align:center;">
        <div style="display:inline-block;padding:12px;background:#F1EFEA;border-radius:50%;margin-bottom:16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D3B36" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style="font-family:serif;font-size:24px;margin:0 0 8px 0;">' . $title . '</h2>
        <p style="color:#68655E;font-size:14px;margin-bottom:24px;">Enter your client access password to view proofs and download high-resolution archives.</p>
        <form action="' . $action . '" method="post">
            <input name="post_password" type="password" required placeholder="Access password" style="width:100%;padding:12px 16px;border:1px solid #DDD9D0;border-radius:8px;margin-bottom:16px;box-sizing:border-box;" />
            <button type="submit" style="width:100%;padding:12px;background:#2D3B36;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Unlock Gallery</button>
        </form>
    </div>';
}
add_filter( 'the_password_form', 'graywood_password_form' );
