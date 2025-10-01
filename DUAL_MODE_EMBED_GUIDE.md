# Dual-Mode Embed System Documentation

## Overview

The dual-mode embed system provides a seamless experience for both **creator preview** (in dashboard) and **public embed** (on host sites). The system ensures embeds are fully integrated and styled natively on host sites while providing accurate live previews in the creator dashboard.

## Key Features

1. **Creator Preview Mode**: Uses design tokens to simulate native styling
2. **Public Embed Mode**: Inherits styles directly from host site
3. **Minimal Script**: ~200 lines vs 1273 in original implementation
4. **No Shadow DOM/iframes**: Direct DOM integration for maximum flexibility
5. **XSS Protection**: HTML escaping for all user content
6. **CSS Variables**: Theme overrides via CSS custom properties

## Architecture

### 1. Design Token System

Design tokens are extracted during creator onboarding from their website:

```typescript
interface DesignTokens {
  '--brand-color': string;
  '--font-family': string;
  '--font-family-heading'?: string;
  '--border-radius'?: string;
  '--spacing'?: string;
  '--shadow'?: string;
  '--text-color'?: string;
  '--background-color'?: string;
  '--secondary-color'?: string;
}
```

These tokens are stored in `creator_profiles.extracted_branding_data` and used to generate CSS custom properties for preview mode.

### 2. Preview Mode (Creator Dashboard)

In the creator dashboard, embeds are wrapped in a container with design tokens applied:

```html
<div class="saasinasnap-preview-wrapper" style="
  --brand-color: #ea580c;
  --font-family: 'Inter', sans-serif;
  --border-radius: 8px;
  --spacing: 1em;
  color: var(--text-color);
  font-family: var(--font-family);
">
  <!-- Embed content here -->
</div>
```

This simulates how the embed will appear on the creator's actual website.

### 3. Public Embed Mode (Host Site)

On the host site, the embed script creates a minimal container and inherits styles:

```html
<!-- Simple script tag - auto-creates container -->
<script src="https://your-domain.com/static/embed-minimal.js" 
  data-creator-id="creator-uuid" 
  data-embed-type="product_card" 
  data-product-id="product-uuid" 
  async>
</script>
```

The embed:
- Auto-creates its own container (no manual div needed)
- Inherits fonts, colors, and other styles from host site
- Only applies minimal layout resets for structure
- Exposes CSS variables for theme overrides

## Implementation Details

### Minimal Embed Script (`embed-minimal.js`)

```javascript
(function(){
  // Escape HTML to prevent XSS
  function escape(s){
    return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;',...}[c]));
  }

  // Get base URL from script source
  function getBaseUrl() { /* ... */ }

  // Auto-create container
  function init(script){
    const cfg = getConfig(script);
    const container = document.createElement('div');
    container.className = 'saasinasnap-embed';
    script.parentNode.insertBefore(container, script.nextSibling);
    // Fetch and render embed...
  }

  // Minimal CSS for layout only
  function injectBaseStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .saasinasnap-embed { display: block; margin: 1em 0; }
      .saasinasnap-embed h3 { margin: 0; font-weight: inherit; }
      /* ... minimal resets only ... */
    `;
    document.head.appendChild(style);
  }
})();
```

### Design Token Extraction (`design-tokens.ts`)

```typescript
export function extractDesignTokens(profile: CreatorProfile): DesignTokens {
  const extractedData = profile.extracted_branding_data;
  
  const tokens: DesignTokens = {
    '--brand-color': profile.brand_color || '#ea580c',
    '--font-family': 'inherit',
  };

  if (extractedData?.fonts?.primary) {
    tokens['--font-family'] = extractedData.fonts.primary;
  }
  
  // Extract other tokens from branding data...
  return tokens;
}
```

### Preview Component (`EmbedCodeDialog.tsx`)

```typescript
// Extract design tokens for preview
const designTokens = extractDesignTokens(creatorProfile);
const tokenCSS = tokensToCSS(designTokens);

// Wrap preview in container with tokens applied
const previewHTML = `
  <div class="saasinasnap-preview-wrapper" style="${tokenCSS}">
    <div id="embed-container"></div>
  </div>
`;
```

## Style Strategy

### What Gets Inherited (Public Mode)

The embed inherits these styles from the host site:
- Typography (font-family, font-size, font-weight)
- Colors (text color, link color, background)
- Border styles (where not explicitly set)
- Spacing (where not explicitly set)

### What Gets Applied (Minimal CSS)

Only structural layout properties:
- Display properties (flex, grid, block)
- Positioning (relative, absolute for indicators)
- Margins for separation (1em default)
- Basic resets (margin: 0 on headings)

### CSS Variable Overrides

Host sites can override embed styling:

```css
.saasinasnap-embed {
  --brand-color: #your-color;
  --font-family: 'Your-Font';
  --border-radius: 12px;
  --spacing: 1.5em;
}
```

## Usage Examples

### Product Card Embed

```html
<!-- Creator's site -->
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="product_card" 
  data-product-id="prod-456" 
  async>
</script>
```

Renders:
```html
<div class="saasinasnap-embed" id="saasinasnap-embed-product_card-prod-456">
  <div class="saasinasnap-product-card">
    <h3>Product Name</h3>
    <p>Product description...</p>
    <div class="saasinasnap-price">$49</div>
    <a href="..." class="saasinasnap-cta">Get Started</a>
  </div>
</div>
```

### Checkout Button Embed

```html
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="checkout_button" 
  data-product-id="prod-456" 
  async>
</script>
```

Renders:
```html
<div class="saasinasnap-embed">
  <a href="..." class="saasinasnap-checkout-btn">Buy Product Name</a>
</div>
```

### Header Embed

```html
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="header" 
  async>
</script>
```

Renders:
```html
<div class="saasinasnap-embed">
  <header class="saasinasnap-header">
    <div class="saasinasnap-header-logo">...</div>
    <nav class="saasinasnap-header-nav">...</nav>
  </header>
</div>
```

## Testing

### Testing Preview Mode

1. Go to Creator Dashboard → Products
2. Click "Get Embed Code" on any product
3. Switch to different embed types
4. Verify preview uses design tokens from creator profile
5. Check that colors, fonts match extracted branding

### Testing Public Embed Mode

1. Copy embed code from dashboard
2. Paste into a test HTML file with custom styles
3. Verify embed inherits host site styles:
   ```html
   <style>
     body { font-family: 'Custom Font'; color: #333; }
   </style>
   ```
4. Embed should use 'Custom Font' and #333 text color
5. Override with CSS variables:
   ```css
   .saasinasnap-embed { --brand-color: red; }
   ```

## Migration Guide

### From Original Embed Script

The minimal embed script is backward compatible but offers cleaner integration:

**Before:**
```html
<div id="saasinasnap-embed-product_card-123"></div>
<script src="/static/embed.js" data-product-id="123" ...></script>
```

**After (Recommended):**
```html
<script src="/static/embed-minimal.js" data-product-id="123" ...></script>
<!-- No manual div needed! -->
```

Both approaches work, but the new script is cleaner and more maintainable.

## Security Considerations

1. **XSS Protection**: All user content is HTML-escaped
2. **CORS**: API endpoints have proper CORS headers
3. **Content Security**: No inline scripts in embed output
4. **URL Validation**: All URLs are validated before use

## Performance

- Script size: ~7KB unminified (~3KB minified)
- Initial load: <50ms
- Subsequent loads: Cached by browser
- No external dependencies
- Async loading doesn't block page render

## Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- IE11: ❌ Not supported (uses modern JS)

## Troubleshooting

### Embed Not Appearing

1. Check browser console for errors
2. Verify `data-creator-id` and `data-embed-type` are set
3. Check CORS headers if embedding cross-origin
4. Verify API endpoint is accessible

### Styles Not Inherited

1. Check host site has proper CSS loaded
2. Verify CSS specificity isn't overriding embed styles
3. Try CSS variable overrides for fine-tuning

### Preview Doesn't Match Production

1. Check if design tokens were extracted during onboarding
2. Verify `extracted_branding_data` in database
3. Re-run branding extraction if needed

## Future Enhancements

1. Advanced theme detection (light/dark mode)
2. Responsive preview modes (mobile/tablet/desktop)
3. A/B testing support for embed variants
4. Analytics integration for embed performance
5. Progressive enhancement for older browsers
