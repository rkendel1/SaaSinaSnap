(function(){
  // Escape HTML to prevent XSS
  function escape(s){
    return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Get base URL from script source
  function getBaseUrl() {
    const currentScript = document.currentScript || 
      Array.from(document.scripts).find(s => s.src && s.src.includes('embed'));
    
    if (currentScript && currentScript.src) {
      try {
        const scriptUrl = new URL(currentScript.src);
        return `${scriptUrl.protocol}//${scriptUrl.host}`;
      } catch (e) {
        console.warn('SaaSinaSnap: Could not determine base URL from script source');
      }
    }
    return window.location.origin;
  }

  // Create embed container with minimal hardcoded styles
  function createEmbed(cfg){
    const c = document.createElement('div');
    c.className = 'saasinasnap-embed';
    c.innerHTML = `
      <h3>${escape(cfg.title)}</h3>
      <p>${escape(cfg.body)}</p>
    `;
    (cfg.target && document.querySelector(cfg.target) || document.body).appendChild(c);
    return c;
  }

  // Parse data attributes from script tag
  function getConfig(script){
    const cfg={};
    for(const a of script.attributes){
      if(a.name.startsWith('data-')) cfg[a.name.slice(5)] = a.value;
    }
    return cfg;
  }

  // Initialize embed
  function init(script){
    const cfg = getConfig(script);
    const embedType = cfg['embed-type'];
    const creatorId = cfg['creator-id'];
    const productId = cfg['product-id'];
    
    if (!creatorId || !embedType) {
      console.error('SaaSinaSnap: Missing required attributes (data-creator-id, data-embed-type)');
      return;
    }

    // Auto-create container
    const containerId = `saasinasnap-embed-${embedType}${productId ? `-${productId}` : ''}`;
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'saasinasnap-embed';
      script.parentNode.insertBefore(container, script.nextSibling);
    }

    // Show loading state
    container.innerHTML = '<div class="saasinasnap-loading">Loading...</div>';

    // Fetch embed data
    const apiUrl = `${getBaseUrl()}/api/embed/product/${creatorId}/${productId || ''}`;
    
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        renderEmbed(container, data, embedType);
      })
      .catch(err => {
        console.error('SaaSinaSnap:', err);
        container.innerHTML = `<div class="saasinasnap-error">Failed to load embed</div>`;
      });
  }

  // Render embed based on type
  function renderEmbed(container, data, embedType) {
    const { creator, product, embedConfig } = data;
    
    switch(embedType) {
      case 'product_card':
        renderProductCard(container, product, creator);
        break;
      case 'checkout_button':
        renderCheckoutButton(container, product, creator);
        break;
      case 'header':
        renderHeader(container, creator);
        break;
      default:
        container.innerHTML = '<div>Unsupported embed type</div>';
    }
  }

  // Render product card - inherits styles from host site
  function renderProductCard(container, product, creator) {
    const price = product.price ? `$${(product.price/100).toFixed(2)}` : '';
    const link = `${getBaseUrl()}/c/${creator.page_slug}/pricing`;
    
    container.innerHTML = `
      <div class="saasinasnap-product-card">
        <h3>${escape(product.name)}</h3>
        ${product.description ? `<p>${escape(product.description)}</p>` : ''}
        ${price ? `<div class="saasinasnap-price">${price}</div>` : ''}
        <a href="${link}" class="saasinasnap-cta" target="_blank" rel="noopener">Get Started</a>
      </div>
    `;
  }

  // Render checkout button
  function renderCheckoutButton(container, product, creator) {
    const link = `${getBaseUrl()}/c/${creator.page_slug}/pricing`;
    container.innerHTML = `
      <a href="${link}" class="saasinasnap-checkout-btn" target="_blank" rel="noopener">
        Buy ${escape(product.name)}
      </a>
    `;
  }

  // Render header
  function renderHeader(container, creator) {
    const homeLink = `${getBaseUrl()}/c/${creator.page_slug}`;
    const pricingLink = `${getBaseUrl()}/c/${creator.page_slug}/pricing`;
    
    container.innerHTML = `
      <header class="saasinasnap-header">
        <div class="saasinasnap-header-logo">
          ${creator.business_logo_url 
            ? `<img src="${creator.business_logo_url}" alt="${escape(creator.business_name)}" />` 
            : `<span>${escape(creator.business_name)}</span>`
          }
        </div>
        <nav class="saasinasnap-header-nav">
          <a href="${homeLink}">Home</a>
          <a href="${pricingLink}">Pricing</a>
          <a href="${pricingLink}" class="saasinasnap-cta">Get Started</a>
        </nav>
      </header>
    `;
  }

  // Inject minimal CSS for layout resets
  function injectBaseStyles() {
    if (document.getElementById('saasinasnap-base-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'saasinasnap-base-styles';
    style.textContent = `
      /* Minimal layout resets - inherit everything else from host */
      .saasinasnap-embed { display: block; margin: 1em 0; }
      .saasinasnap-embed h3 { margin: 0; font-weight: inherit; }
      .saasinasnap-embed p { margin: 0.5em 0 0; }
      .saasinasnap-loading { padding: 1em; text-align: center; }
      .saasinasnap-error { padding: 1em; color: #dc2626; }
      
      /* Product card - minimal structure */
      .saasinasnap-product-card { padding: 1.5em; border: 1px solid currentColor; border-radius: 0.5em; }
      .saasinasnap-price { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
      .saasinasnap-cta { display: inline-block; padding: 0.5em 1em; text-decoration: none; }
      
      /* Checkout button */
      .saasinasnap-checkout-btn { display: inline-block; padding: 0.75em 1.5em; text-decoration: none; }
      
      /* Header */
      .saasinasnap-header { display: flex; align-items: center; justify-content: space-between; padding: 1em; }
      .saasinasnap-header-logo img { height: 2em; }
      .saasinasnap-header-nav { display: flex; gap: 1em; align-items: center; }
      .saasinasnap-header-nav a { text-decoration: none; }
      
      /* CSS Custom Properties for theme overrides */
      .saasinasnap-embed {
        --saasinasnap-brand-color: var(--brand-color, inherit);
        --saasinasnap-font-family: var(--font-family, inherit);
        --saasinasnap-border-radius: var(--border-radius, 0.5em);
        --saasinasnap-spacing: var(--spacing, 1em);
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize on DOM ready
  const s = document.currentScript;
  if (s) {
    injectBaseStyles();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(s));
    } else {
      init(s);
    }
  }

  // Export for programmatic usage
  window.SaaSinaSnap = { init };
})();
