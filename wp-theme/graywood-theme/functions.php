<?php
/**
 * Graywood Block Theme — functions.php
 *
 * Enqueues additional styles and provides theme support hooks
 * for the Graywood Scandinavian editorial WordPress theme.
 *
 * @package Graywood
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

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
 * Enqueue editor styles so Gutenberg mirrors the frontend.
 */
function graywood_editor_styles() {
    add_editor_style( 'assets/css/custom.css' );
}
add_action( 'after_setup_theme', 'graywood_editor_styles' );

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
 * Replaces the default ugly WP password form with Graywood's Nordic styled version.
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
