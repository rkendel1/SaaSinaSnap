# Dual-Mode Embed System - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DUAL-MODE EMBED SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      1. CREATOR ONBOARDING PHASE                        │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  Creator enters  │
    │  website URL     │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  AI extracts     │
    │  design tokens   │
    │  - Colors        │
    │  - Fonts         │
    │  - Spacing       │
    │  - Borders       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Store in DB:    │
    │  extracted_      │
    │  branding_data   │
    └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      2. CREATOR PREVIEW MODE                            │
│                      (In Dashboard)                                      │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────┐
    │  Creator Dashboard → Products → Get Embed Code           │
    └────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  EmbedCodeDialog Component                             │
    │                                                        │
    │  1. extractDesignTokens(profile)                       │
    │     ├── Gets brand_color                              │
    │     └── Gets extracted_branding_data                  │
    │                                                        │
    │  2. Generates CSS custom properties:                   │
    │     --brand-color: #ea580c                            │
    │     --font-family: 'Inter'                            │
    │     --border-radius: 8px                              │
    │                                                        │
    │  3. Wraps preview in styled container:                │
    │     <div class="preview-wrapper" style="...tokens">   │
    │       <iframe with embed script />                    │
    │     </div>                                            │
    └────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  Preview shows embed WITH design tokens applied        │
    │  ✓ Simulates appearance on creator's actual website   │
    └────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      3. PUBLIC EMBED MODE                               │
│                      (On Host Site)                                      │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────┐
    │  Host Website HTML                                       │
    │  ┌────────────────────────────────────────────────────┐ │
    │  │ <style>                                            │ │
    │  │   body {                                           │ │
    │  │     font-family: 'Custom Font';                    │ │
    │  │     color: #333;                                   │ │
    │  │   }                                                │ │
    │  │ </style>                                           │ │
    │  │                                                    │ │
    │  │ <script src="/static/embed-minimal.js"            │ │
    │  │   data-creator-id="..."                           │ │
    │  │   data-embed-type="product_card"                  │ │
    │  │   data-product-id="..."                           │ │
    │  │   async>                                          │ │
    │  │ </script>                                         │ │
    │  └────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  embed-minimal.js execution:                           │
    │                                                        │
    │  1. Auto-creates container div                         │
    │  2. Injects minimal CSS (layout only)                 │
    │  3. Fetches embed data from API                       │
    │  4. Renders embed content                             │
    └────────────────────────────────────────────────────────┘
                                 │
                                 ▼
    ┌────────────────────────────────────────────────────────┐
    │  Result: Embed with inherited styles                   │
    │                                                        │
    │  ✓ Uses host's 'Custom Font'                          │
    │  ✓ Uses host's #333 text color                        │
    │  ✓ Only applies minimal layout CSS                    │
    │  ✓ Can be overridden with CSS variables              │
    └────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      4. STYLE INHERITANCE                               │
└─────────────────────────────────────────────────────────────────────────┘

    HOST SITE STYLES              MINIMAL EMBED CSS           RESULT
    ┌────────────────┐           ┌────────────────┐         ┌────────────┐
    │ font-family    │──────────▶│ inherit ───────│────────▶│ Host font  │
    │ color          │──────────▶│ inherit ───────│────────▶│ Host color │
    │ spacing        │──────────▶│ inherit ───────│────────▶│ Host space │
    └────────────────┘           │                │         └────────────┘
                                 │ display: block │
                                 │ margin: 1em    │
                                 │ (layout only)  │
                                 └────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      5. CSS VARIABLE OVERRIDES                          │
└─────────────────────────────────────────────────────────────────────────┘

    Host can override specific styles using CSS variables:

    .saasinasnap-embed {
      --brand-color: #custom-color;      ← Override brand color
      --font-family: 'Custom Font';      ← Override font
      --border-radius: 12px;             ← Override border radius
      --spacing: 1.5em;                  ← Override spacing
    }


┌─────────────────────────────────────────────────────────────────────────┐
│                      KEY FEATURES                                       │
└─────────────────────────────────────────────────────────────────────────┘

✓ Dual-Mode Experience
  ├── Preview mode uses design tokens
  └── Public mode inherits host styles

✓ Minimal Script Size
  ├── ~7KB unminified (~3KB minified)
  └── vs. 49KB for original embed.js

✓ Auto-Setup
  ├── No manual div creation needed
  └── Script auto-creates container

✓ Style Inheritance
  ├── Inherits fonts, colors, spacing
  └── Only applies layout CSS

✓ Flexible Theming
  ├── CSS variables for overrides
  └── Full control for host site

✓ Security
  ├── HTML escaping (XSS protection)
  ├── CORS headers
  └── No inline scripts

✓ Performance
  ├── Async loading
  ├── Browser caching
  └── No external dependencies


┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPARISON                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────┬──────────────────────────────┐
│ Feature              │ Shadow DOM       │ Dual-Mode (Our Solution)     │
├──────────────────────┼──────────────────┼──────────────────────────────┤
│ Style Isolation      │ Complete         │ Minimal (by design)          │
│ Host Site Theming    │ Difficult        │ Easy (inherits naturally)    │
│ CSS Customization    │ Limited          │ Full control                 │
│ Script Size          │ Larger           │ Smaller (~7KB)               │
│ Preview Accuracy     │ N/A              │ High (design tokens)         │
│ Setup Complexity     │ Medium           │ Low (auto-setup)             │
│ Browser Support      │ Modern only      │ Modern (no IE11)             │
└──────────────────────┴──────────────────┴──────────────────────────────┘
```
