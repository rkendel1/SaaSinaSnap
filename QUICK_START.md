# Quick Start Guide - Dual-Mode Embed System

## For Creators

### Step 1: Complete Onboarding
During onboarding, provide your website URL. The system will automatically extract:
- Brand colors
- Fonts
- Spacing patterns
- Border styles

### Step 2: Get Your Embed Code
1. Navigate to **Dashboard → Products**
2. Click **"Get Embed Code"** on any product
3. Choose your embed type:
   - **Product Card**: Full featured product display
   - **Checkout Button**: Simple buy button
   - **Header**: Navigation with your branding

### Step 3: Preview Your Embed
Click the **"Live Preview"** tab to see how your embed will look on your website. The preview uses the design tokens extracted during onboarding.

### Step 4: Copy & Paste
Copy the embed code and paste it into your website's HTML. That's it! The embed will automatically:
- Match your website's fonts
- Use your website's colors
- Adapt to your website's styling

## For Developers

### Quick Integration

```html
<!-- Simple one-line integration -->
<script src="https://your-domain.com/static/embed-minimal.js" 
  data-creator-id="your-creator-id" 
  data-embed-type="product_card" 
  data-product-id="your-product-id" 
  async>
</script>
```

### Available Embed Types

#### Product Card
```html
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="product_card" 
  data-product-id="prod-456" 
  async>
</script>
```

#### Checkout Button
```html
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="checkout_button" 
  data-product-id="prod-456" 
  async>
</script>
```

#### Header
```html
<script src="/static/embed-minimal.js" 
  data-creator-id="abc-123" 
  data-embed-type="header" 
  async>
</script>
```

### Customizing with CSS

The embed inherits your website's styles by default, but you can override specific properties:

```css
/* Override brand color */
.saasinasnap-embed {
  --brand-color: #e74c3c;
}

/* Override font */
.saasinasnap-embed {
  --font-family: 'Roboto', sans-serif;
}

/* Override multiple properties */
.saasinasnap-embed {
  --brand-color: #3498db;
  --font-family: 'Open Sans', sans-serif;
  --border-radius: 12px;
  --spacing: 1.5em;
  --text-color: #2c3e50;
}
```

### Advanced: Scoped Styling

Apply custom styles to specific embeds:

```html
<div class="custom-theme">
  <script src="/static/embed-minimal.js" 
    data-creator-id="abc-123" 
    data-embed-type="product_card" 
    data-product-id="prod-456" 
    async>
  </script>
</div>

<style>
  .custom-theme .saasinasnap-embed {
    --brand-color: #e74c3c;
    --border-radius: 16px;
  }
</style>
```

## Testing Your Integration

### 1. Local Testing

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Embed Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <h1>My Website</h1>
  
  <!-- Your embed here -->
  <script src="https://your-domain.com/static/embed-minimal.js" 
    data-creator-id="your-id" 
    data-embed-type="product_card" 
    data-product-id="your-product-id" 
    async>
  </script>
</body>
</html>
```

### 2. Verify Style Inheritance

The embed should:
- ✅ Use Arial font (from body)
- ✅ Use #333 text color (from body)
- ✅ Have 2rem padding inherited
- ✅ Maintain minimal layout structure

### 3. Check Browser Console

Open browser console (F12) and verify:
- ✅ No JavaScript errors
- ✅ Embed container is created
- ✅ Data is fetched successfully

## Common Scenarios

### Scenario 1: Match Site Colors
```css
:root {
  --site-primary: #3498db;
  --site-text: #2c3e50;
}

.saasinasnap-embed {
  --brand-color: var(--site-primary);
  --text-color: var(--site-text);
}
```

### Scenario 2: Dark Mode Support
```css
@media (prefers-color-scheme: dark) {
  .saasinasnap-embed {
    --brand-color: #5dade2;
    --text-color: #ecf0f1;
    --background-color: #2c3e50;
  }
}
```

### Scenario 3: Responsive Sizing
```css
.saasinasnap-embed {
  max-width: 400px;
  margin: 2rem auto;
}

@media (max-width: 768px) {
  .saasinasnap-embed {
    max-width: 100%;
    margin: 1rem 0;
  }
}
```

## Troubleshooting

### Embed Not Appearing?

1. **Check Required Attributes**
   ```html
   <!-- ✅ Correct -->
   <script data-creator-id="abc" data-embed-type="product_card" ...>
   
   <!-- ❌ Missing attributes -->
   <script src="embed.js" async></script>
   ```

2. **Verify CORS**
   - Ensure your domain is allowed
   - Check browser console for CORS errors

3. **Check API Response**
   - Open Network tab (F12)
   - Look for `/api/embed/product/...` request
   - Verify 200 status code

### Styles Not Matching?

1. **Check CSS Specificity**
   ```css
   /* Too specific - won't work */
   body div.content .saasinasnap-embed { }
   
   /* Just right */
   .saasinasnap-embed { }
   ```

2. **Use CSS Variables**
   ```css
   /* Override specific properties */
   .saasinasnap-embed {
     --brand-color: #custom !important;
   }
   ```

3. **Inspect Element**
   - Right-click embed → Inspect
   - Check computed styles
   - Verify inheritance chain

### Preview vs. Production Mismatch?

1. **Re-extract Design Tokens**
   - Go to Profile Settings
   - Update website URL
   - Re-run branding extraction

2. **Clear Browser Cache**
   - Hard reload (Ctrl+Shift+R)
   - Clear cached data

3. **Check Console for Errors**
   - Open browser console
   - Look for loading errors

## Performance Tips

### 1. Async Loading
Always use `async` attribute:
```html
<script src="..." async></script>
```

### 2. Multiple Embeds
Place all scripts at end of body:
```html
<body>
  <!-- content -->
  
  <script src="..." data-product-id="1" async></script>
  <script src="..." data-product-id="2" async></script>
  <script src="..." data-product-id="3" async></script>
</body>
```

### 3. Caching
The script is cached by browsers. First load: ~7KB, subsequent loads: cached.

## Security Best Practices

1. **Validate Embed Codes**
   - Only use embed codes from your dashboard
   - Don't modify creator-id or product-id

2. **Content Security Policy (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="script-src 'self' https://your-domain.com;">
   ```

3. **Monitor Usage**
   - Check dashboard analytics
   - Monitor for unusual patterns

## Next Steps

- 📖 Read [Full Documentation](DUAL_MODE_EMBED_GUIDE.md)
- 🏗️ View [Architecture Diagram](DUAL_MODE_ARCHITECTURE.md)
- 🎨 Try [Demo Page](examples/dual-mode-embed-demo.html)
- 🧪 Run Tests: `npm test design-tokens.test.ts`

## Support

Need help? Check:
- Documentation: `DUAL_MODE_EMBED_GUIDE.md`
- Demo: `examples/dual-mode-embed-demo.html`
- Tests: `src/utils/__tests__/design-tokens.test.ts`

## Feature Requests

Want to see new features? Consider:
- Dark mode auto-detection
- Responsive preview modes
- A/B testing support
- Advanced analytics
