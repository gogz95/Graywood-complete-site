# Contributing to Graywood

Thank you for your interest in contributing to the Graywood WordPress Block Theme and Docker ecosystem!

## Core Principles

1. **Native Block Grammar (FSE First):**
   - Every layout and template must be 100% editable inside the WordPress Block Editor and Site Editor (`Appearance → Editor`).
   - Do NOT introduce custom HTML forms, inline layout scripts, or hardcoded markup outside valid Gutenberg comments (`<!-- wp:... -->`).
   - Use standard WordPress block primitives: `wp:group`, `wp:columns`, `wp:heading`, `wp:paragraph`, `wp:buttons`, `wp:navigation`.

2. **Design System & Aesthetics:**
   - Preserve the Scandinavian editorial aesthetic: minimalist monochrome palette, warm paper canvas (`#fafafa`), deep black ink (`#111111`), refined typography (`Playfair Display`, `Inter`, `JetBrains Mono`).
   - Colors, spacing, and typography must be configured via `theme.json` tokens, not ad-hoc inline styles.

3. **Security & Zero-Leak Policy:**
   - NEVER commit real credentials, database passwords, private client photos, or production domain names.
   - Always use RFC 2606 / RFC 6761 reserved documentation domains (`hub.example.com`, `photography.example.com`, `media.example.com`).

## Development Workflow

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/your-username/graywood-complete-site.git
   cd graywood-complete-site
   ```

2. **Start the Local Environment:**
   ```bash
   # Linux / macOS
   ./setup.sh

   # Windows (PowerShell)
   .\setup.ps1
   ```

3. **Make Your Changes:**
   - Theme files live in `wp-theme/graywood-theme/`.
   - Ensure all templates in `templates/*.html` and `parts/*.html` maintain balanced Gutenberg comments.
   - Run `php -l` on any modified PHP files to guarantee zero syntax errors.

4. **Submit a Pull Request:**
   - Provide a concise description of what was changed and why.
   - Include before-and-after screenshots for any visual adjustments.
