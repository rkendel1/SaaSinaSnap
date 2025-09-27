(function() {
  // Enhanced function to get the base URL dynamically for cross-environment compatibility
  function getBaseUrl() {
    // Check if we're in development, staging, or production based on embed script src
    const currentScript = document.currentScript || 
      Array.from(document.scripts).find(s => s.src && s.src.includes('embed.js'));
    
    if (currentScript && currentScript.src) {
      try {
        const scriptUrl = new URL(currentScript.src);
        // Return the base URL from where the embed script is served
        return `${scriptUrl.protocol}//${scriptUrl.host}`;
      } catch (e) {
        console.warn('SaaSinaSnap Embed: Could not determine base URL from script source');
      }
    }
    
    // Fallback to current page origin (less reliable for cross-site embeds)
    return window.location.origin;
  }

  // Function to detect environment based on various indicators
  function detectEnvironment(stripeKey, productData) {
    // Check Stripe key prefix
    if (stripeKey) {
      if (stripeKey.startsWith('pk_test_')) {
        return 'test';
      } else if (stripeKey.startsWith('pk_live_')) {
        return 'production';
      }
    }

    // Check product metadata for environment markers
    if (productData && productData.metadata && productData.metadata.environment) {
      return productData.metadata.environment;
    }

    // Check URL patterns
    const hostname = window.location.hostname;
    if (hostname.includes('test') || hostname.includes('staging') || hostname.includes('dev')) {
      return 'test';
    }

    return 'unknown';
  }

  // Function to create environment indicator
  function createEnvironmentIndicator(environment, embedId, config) {
    if (!config.show || environment === 'unknown') {
      return null;
    }

    const isTest = environment === 'test';
    const indicatorId = 'env-indicator-' + embedId;
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.id = indicatorId;
    indicator.className = isTest ? 'test-indicator' : 'production-indicator';
    indicator.innerHTML = '<span class="env-text">' + (isTest ? 'TEST MODE' : 'LIVE') + '</span>';
    
    // Apply styles
    const baseStyles = {
      position: 'absolute',
      zIndex: '9999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '4px 8px',
      borderRadius: '12px',
      color: 'white',
      opacity: config.opacity || '0.8',
      transition: 'opacity 0.2s ease-in-out',
      pointerEvents: 'none',
      userSelect: 'none'
    };

    // Position styles
    const positionStyles = getPositionStyles(config.position || 'top-right');
    
    // Environment-specific styles
    const envStyles = isTest ? {
      background: '#f59e0b',
      boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
    } : {
      background: '#10b981',
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
    };

    // Apply all styles
    Object.assign(indicator.style, baseStyles, positionStyles, envStyles);
    
    // Add hover effect
    indicator.addEventListener('mouseenter', function() {
      indicator.style.opacity = '1';
    });
    
    indicator.addEventListener('mouseleave', function() {
      indicator.style.opacity = config.opacity || '0.8';
    });

    return indicator;
  }

  // Helper function to get position styles
  function getPositionStyles(position) {
    switch (position) {
      case 'top-left':
        return { top: '8px', left: '8px' };
      case 'top-right':
        return { top: '8px', right: '8px' };
      case 'bottom-left':
        return { bottom: '8px', left: '8px' };
      case 'bottom-right':
        return { bottom: '8px', right: '8px' };
      default:
        return { top: '8px', right: '8px' };
    }
  }

  // Function to format price
  function formatPrice(price, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }

  // Function to get price label
  function getPriceLabel(productType) {
    switch (productType) {
      case 'subscription':
        return '/month';
      case 'usage_based':
        return '/usage';
      default:
        return '';
    }
  }

  // Enhanced function to generate consistent branding styles
  function generateGradientCss(brandColor) {
    // Validate and sanitize brand color
    if (!brandColor || typeof brandColor !== 'string') {
      brandColor = '#ea580c'; // Default orange
    }
    
    // Generate consistent gradient for brand alignment
    return `linear-gradient(45deg, ${brandColor}, ${brandColor}80)`;
  }

  // Function to calculate brand alignment score (0-1)
  function calculateBrandAlignment(creator) {
    let score = 0;
    let factors = 0;
    
    // Check for brand color
    if (creator.brand_color) {
      score += 0.3;
    }
    factors += 0.3;
    
    // Check for business logo
    if (creator.business_logo_url) {
      score += 0.3;
    }
    factors += 0.3;
    
    if (creator.business_name) {
      score += 0.2;
    }
    factors += 0.2;
    
    if (creator.business_description) {
      score += 0.2;
    }
    factors += 0.2;
    
    return factors > 0 ? score / factors : 0;
  }

  // Function to create scoped CSS to prevent style conflicts
  function createScopedCSS(embedId, css) {
    const scopedRules = css.split('}').map(rule => {
      if (rule.trim()) {
        const [selector, ...styles] = rule.split('{');
        if (selector && styles.length > 0) {
          return `#${embedId} ${selector.trim()} { ${styles.join('{')} }`;
        }
      }
      return rule;
    }).join('');
    
    return scopedRules;
  }

  // Function to inject scoped styles
  function injectEmbedStyles(embedId, css) {
    const existingStyle = document.getElementById(`${embedId}-styles`);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = `${embedId}-styles`;
    styleElement.textContent = createScopedCSS(embedId, css);
    document.head.appendChild(styleElement);
  }

  // Enhanced error handling and validation
  function validateEmbedConfiguration(script) {
    const errors = [];
    const creatorId = script.getAttribute('data-creator-id');
    const embedType = script.getAttribute('data-embed-type');
    const productId = script.getAttribute('data-product-id');
    const assetId = script.getAttribute('data-asset-id'); // New: assetId for specific embeds
    
    if (!creatorId || creatorId.trim() === '') {
      errors.push('data-creator-id is required');
    }
    
    if (!embedType || embedType.trim() === '') {
      errors.push('data-embed-type is required');
    }
    
    const validEmbedTypes = [
      'product_card', 'checkout_button', 'header', 'hero_section', 
      'product_description', 'testimonial_section', 'footer', 'pricing_table', 'trial_embed', 'custom'
    ];
    
    if (embedType && !validEmbedTypes.includes(embedType)) {
      errors.push(`Invalid embed type: ${embedType}. Valid types: ${validEmbedTypes.join(', ')}`);
    }
    
    if ((embedType === 'product_card' || embedType === 'checkout_button' || embedType === 'product_description') && !productId) {
      errors.push(`${embedType} embed requires data-product-id attribute`);
    }

    if ((embedType === 'trial_embed' || embedType === 'custom') && !assetId) {
      errors.push(`${embedType} embed requires data-asset-id attribute`);
    }
    
    return errors;
  }

  // Function to render error state with consistent branding
  function renderErrorState(targetElement, message, brandColor = '#ef4444') {
    const errorHtml = `
      <div style="
        padding: 16px;
        border: 2px solid ${brandColor};
        border-radius: 8px;
        background-color: #fef2f2;
        color: #991b1b;
        font-family: sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 400px;
        margin: 8px 0;
      ">
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" style="margin-right: 8px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <strong>SaaSinaSnap Embed Error</strong>
        </div>
        <div>${message}</div>
      </div>
    `;
    targetElement.innerHTML = errorHtml;
  }

  // Function to render loading state
  function renderLoadingState(targetElement, brandColor = '#ea580c') {
    const loadingHtml = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
        font-family: sans-serif;
        color: #6b7280;
      ">
        <div style="
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top-color: ${brandColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        "></div>
        Loading...
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    targetElement.innerHTML = loadingHtml;
  }

  // --- Render Functions for different embed types ---

  function renderProductCard(targetElement, product, creator, embedConfig, brandAlignment = 0) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const gradientCss = generateGradientCss(brandColor);
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug

    const features = embedConfig.features || [
      'Full access to all features',
      '24/7 customer support',
      'Cancel anytime',
    ];

    const embedId = `saasinasnap-embed-card-${product.id}`;
    
    const cardStyles = `
      .saasinasnap-card {
        position: relative;
        display: flex;
        flex-direction: column;
        border-width: ${embedConfig.highlighted ? '2px' : '1px'};
        border-style: solid;
        border-color: ${embedConfig.highlighted ? brandColor : embedConfig.borderColor || '#e5e7eb'};
        border-radius: ${embedConfig.borderRadius || '0.5rem'};
        background-color: ${embedConfig.backgroundColor || '#ffffff'};
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-family: ${embedConfig.fonts?.[0] || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif'};
        max-width: ${embedConfig.width || '320px'};
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        color: ${embedConfig.textColor || '#111827'};
      }
      .saasinasnap-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 8px -1px rgba(0, 0, 0, 0.1);
      }
    `;

    injectEmbedStyles(embedId, cardStyles);

    const productCardHtml = `
      <div class="saasinasnap-card" id="${embedId}">
        ${embedConfig.showImage && embedConfig.imageUrl ? `
          <img src="${embedConfig.imageUrl}" alt="${embedConfig.productName || product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: ${embedConfig.borderRadius || '0.5rem'} ${embedConfig.borderRadius || '0.5rem'} 0 0; margin-bottom: 1rem;" />
        ` : ''}
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <h3 style="
            margin-bottom: 0.5rem;
            font-size: 1.25rem;
            line-height: 1.75rem;
            font-weight: 700;
            color: ${embedConfig.textColor || '#111827'};
          ">
            ${embedConfig.productName || product.name}
          </h3>
          ${embedConfig.showDescription && (embedConfig.description || product.description) ? `<p style="margin-bottom: 1rem; font-size: 0.875rem; line-height: 1.25rem; color: ${embedConfig.textColor || '#4b5563'}; opacity: 0.8;">${embedConfig.description || product.description}</p>` : ''}
          ${embedConfig.showPrice && (embedConfig.price || product.price) ? `
            <div style="display: flex; align-items: baseline; justify-content: center;">
              <span style="font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; color: ${brandColor};">
                ${formatPrice(embedConfig.price || product.price, embedConfig.currency || product.currency)}
              </span>
              <span style="margin-left: 0.25rem; color: ${embedConfig.textColor || '#4b5563'}; opacity: 0.8;">
                ${getPriceLabel(product.product_type)}
              </span>
            </div>
          ` : ''}
        </div>

        <ul style="margin-bottom: 1.5rem; flex: 1; padding-left: 0; list-style: none; text-align: left;">
          ${features.map(feature => `
            <li style="display: flex; align-items: center; font-size: 0.875rem; line-height: 1.25rem; color: ${embedConfig.textColor || '#4b5563'}; margin-bottom: 0.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem; flex-shrink: 0;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              ${feature}
            </li>
          `).join('')}
        </ul>

        <a 
          href="${pricingPageUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="
            display: inline-flex;
            width: 100%;
            align-items: center;
            justify-content: center;
            border-radius: ${embedConfig.borderRadius || '0.5rem'};
            padding: 0.75rem 1.5rem;
            text-align: center;
            font-weight: 600;
            color: ${embedConfig.buttonTextColor || '#ffffff'};
            background: ${embedConfig.buttonStyle === 'outline' ? 'transparent' : (embedConfig.buttonColor || gradientCss)};
            border: ${embedConfig.buttonStyle === 'outline' ? `2px solid ${brandColor}` : 'none'};
            transition: all 0.2s ease-in-out;
            text-decoration: none;
            cursor: pointer;
          "
          onmouseover="this.style.transform='scale(1.02)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          ${embedConfig.buttonText || 'Get Started'}
        </a>
        
        <div style="display: none;" data-brand-alignment="${brandAlignment.toFixed(2)}"></div>
      </div>
    `;
    targetElement.innerHTML = productCardHtml;
  }

  function renderCheckoutButton(targetElement, product, creator, embedConfig, stripePriceId, brandAlignment = 0) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const gradientCss = generateGradientCss(brandColor);

    const button = document.createElement('button');
    button.textContent = embedConfig.buttonText || `Buy ${embedConfig.productName || product.name} - ${formatPrice(embedConfig.price || product.price, embedConfig.currency || product.currency)}`;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: ${embedConfig.borderRadius || '0.5rem'};
      padding: 0.75rem 1.5rem;
      text-align: center;
      font-weight: 600;
      color: ${embedConfig.buttonTextColor || '#ffffff'};
      background: ${embedConfig.buttonStyle === 'outline' ? 'transparent' : (embedConfig.buttonColor || gradientCss)};
      border: ${embedConfig.buttonStyle === 'outline' ? `2px solid ${brandColor}` : 'none'};
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      font-family: ${embedConfig.fonts?.[0] || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif'};
      font-size: 1rem;
      line-height: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `;

    button.onmouseover = () => { 
      button.style.transform = 'scale(1.02)'; 
      button.style.boxShadow = '0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 3px 6px -1px rgba(0, 0, 0, 0.1)';
    };
    button.onmouseout = () => { 
      button.style.transform = 'scale(1)'; 
      button.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    };
    button.onmousedown = () => { button.style.transform = 'scale(0.98)'; };
    button.onmouseup = () => { button.style.transform = 'scale(1.02)'; };

    const originalText = button.textContent;
    button.setAttribute('data-brand-alignment', brandAlignment.toFixed(2));

    button.addEventListener('click', async () => {
      // PostHog: Capture embed checkout button click event
      if (window.posthog) {
        window.posthog.capture('embed_checkout_button_clicked', {
          creator_id: creator.id,
          product_id: product.id,
          embed_type: 'checkout_button',
          embed_id: targetElement.id,
          current_url: window.location.href,
        });
      }

      button.textContent = 'Processing...';
      button.disabled = true;
      button.style.opacity = '0.7';
      button.style.cursor = 'wait';
      
      try {
        const response = await fetch(`${getBaseUrl()}/api/embed/checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId: creator.id,
            productId: product.id,
            stripePriceId: stripePriceId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const { checkoutUrl } = await response.json();
        if (!checkoutUrl) {
          throw new Error('No checkout URL received from server');
        }
        
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('SaaSinaSnap Embed: Error creating checkout session:', error);
        
        // PostHog: Capture embed checkout error event
        if (window.posthog) {
          window.posthog.capture('embed_checkout_error', {
            creator_id: creator.id,
            product_id: product.id,
            embed_type: 'checkout_button',
            embed_id: targetElement.id,
            error_message: error.message,
            current_url: window.location.href,
          });
        }

        const errorMsg = error.message.includes('HTTP') 
          ? 'Service temporarily unavailable. Please try again.' 
          : 'Failed to initiate checkout. Please try again.';
          
        alert(errorMsg);
        
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    });

    targetElement.innerHTML = '';
    targetElement.appendChild(button);
  }

  function renderHeader(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const gradientCss = generateGradientCss(brandColor);
    const homeUrl = `${getBaseUrl()}/c/${creator.page_slug}`; // Use creator.page_slug
    const pricingUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug

    const headerHtml = `
      <header style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: ${embedConfig.padding || '1rem 1.5rem'};
        background-color: ${embedConfig.backgroundColor || '#ffffff'};
        border-bottom: 1px solid ${embedConfig.borderColor || '#e5e7eb'};
        font-family: ${embedConfig.fonts?.[0] || 'sans-serif'};
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        color: ${embedConfig.textColor || '#1f2937'};
      ">
        <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center;">
          ${embedConfig.showLogo && creator.business_logo_url ? `
            <img src="${creator.business_logo_url}" 
                 alt="${creator.business_name || 'Business Logo'}" 
                 style="height: 2.5rem; width: auto; margin-right: 0.5rem;">
          ` : `
            <div style="font-size: 1.5rem; font-weight: 700; color: ${brandColor};">
              ${creator.business_name || 'SaaSinaSnap'}
            </div>
          `}
        </a>
        
        <nav style="display: flex; align-items: center; gap: 1.5rem;">
          ${(embedConfig.navigationItems || [{label: 'Home', url: homeUrl}, {label: 'Pricing', url: pricingUrl}]).map(item => `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: ${embedConfig.textColor || '#4b5563'}; text-decoration: none; font-weight: 500; transition: color 0.2s ease-in-out;">
              ${item.label}
            </a>
          `).join('')}
          <a 
            href="${pricingUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: ${embedConfig.borderRadius || '0.5rem'};
              padding: 0.5rem 1rem;
              text-align: center;
              font-weight: 600;
              color: ${embedConfig.buttonTextColor || '#ffffff'} !important; /* Ensure white text */
              background: ${embedConfig.buttonColor || gradientCss};
              border: ${embedConfig.buttonStyle === 'outline' ? `2px solid ${brandColor}` : 'none'};
              transition: all 0.2s ease-in-out;
              text-decoration: none;
              font-size: 0.875rem;
            "
          >
            ${embedConfig.ctaText || 'Get Started'}
          </a>
        </nav>
      </header>
    `;
    targetElement.innerHTML = headerHtml;
  }

  function renderHeroSection(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const gradientCss = generateGradientCss(brandColor);
    const homeUrl = `${getBaseUrl()}/c/${creator.page_slug}`; // Use creator.page_slug
    const pricingUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug

    const title = embedConfig.title || (creator.business_name ? `Welcome to ${creator.business_name}` : 'Welcome to SaaSinaSnap');
    const description = embedConfig.description || creator.business_description || 'SaaS in a Snap - Get your business running quickly and efficiently.';
    const ctaText = embedConfig.ctaText || 'Get Started';

    const heroHtml = `
      <section style="
        background: ${embedConfig.backgroundImage || `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)`};
        padding: ${embedConfig.padding || '80px 24px'};
        text-align: center;
        min-height: ${embedConfig.height || '500px'};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
        color: #1f2937';
      ">
        <div style="max-width: ${embedConfig.width || '800px'}; position: relative; z-index: 2;">
          <h1 style="
            font-size: clamp(32px, 5vw, 56px);
            font-weight: 800;
            margin: 0 0 24px 0;
            line-height: 1.2;
            background: ${gradientCss};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
          ">${title}</h1>
          
          <p style="
            font-size: clamp(18px, 2.5vw, 24px);
            color: ${embedConfig.textColor || '#4b5563'};
            margin: 0 0 40px 0;
            line-height: 1.6;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${description}</p>
          
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="${pricingUrl}" 
               target="_blank"
               rel="noopener noreferrer"
               style="
                 display: inline-flex;
                 align-items: center;
                 padding: 16px 32px;
                 background: ${brandColor};
                 color: white;
                 text-decoration: none;
                 border-radius: 50px;
                 font-weight: 600;
                 font-size: 18px;
                 transition: all 0.3s ease;
                 box-shadow: 0 4px 15px ${brandColor}40;
               ">
              ${ctaText}
            </a>
            
            <a href="${homeUrl}" 
               target="_blank"
               rel="noopener noreferrer"
               style="
                 display: inline-flex;
                 align-items: center;
                 padding: 16px 32px;
                 background: transparent;
                 color: ${brandColor};
                 text-decoration: none;
                 border: 2px solid ${brandColor};
                 border-radius: 50px;
                 font-weight: 600;
                 font-size: 18px;
                 transition: all 0.3s ease;
               ">
              Learn More
            </a>
          </div>
        </div>
        
        <!-- Decorative elements -->
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, ${brandColor}08 1px, transparent 1px);
          background-size: 50px 50px;
          animation: float 20s ease-in-out infinite;
          z-index: 1;
        "></div>
      </section>
    `;

    const css = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      
      .hero-section {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      @media (max-width: 768px) {
        .hero-section {
          padding: 60px 16px;
          min-height: 400px;
        }
      }
    `;

    const embedCode = generateEmbedCode(creator.id, 'hero_section');

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'hero_section',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'responsive-design',
          'animations',
          ...(embedConfig.voiceAndTone ? ['voice-tone-adaptation'] : []),
          ...(embedConfig.title || embedConfig.description || embedConfig.ctaText ? ['custom-content'] : [])
        ]
      }
    };
  }

  function renderProductDescription(targetElement, product, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea5800c';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug

    const title = embedConfig.title || product.name;
    const description = embedConfig.description || product.description || 'Experience the best with our premium offering designed to meet all your needs.';
    const ctaText = embedConfig.ctaText || 'Learn More';

    const descriptionHtml = `
      <div style="
        max-width: ${embedConfig.width || '600px'};
        padding: ${embedConfig.padding || '32px'};
        background: ${embedConfig.backgroundColor || 'white'};
        border-radius: ${embedConfig.borderRadius || '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
        margin: ${embedConfig.margin || '16px auto'};
        color: ${embedConfig.textColor || '#1f2937'};
      ">
        <h2 style="
          color: ${brandColor};
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        ">${title}</h2>
        
        <p style="
          color: ${embedConfig.textColor || '#6b7280'};
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-size: 16px;
        ">${description}</p>
        
        <a href="${pricingPageUrl}" 
           target="_blank"
           rel="noopener noreferrer"
           style="
             background: ${brandColor};
             color: white;
             padding: 12px 24px;
             border-radius: 8px;
             text-decoration: none;
             font-weight: 600;
             display: inline-block;
             transition: all 0.2s ease;
           ">
          ${ctaText}
        </a>
      </div>
    `;
    
    targetElement.innerHTML = descriptionHtml;
  }

  function renderTestimonialSection(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug
    
    const testimonials = embedConfig.testimonials || [
      { text: "This platform has transformed how we do business. Highly recommended!", author: "Sarah Johnson", role: "CEO, TechCorp" },
      { text: "Amazing customer support and great value for money.", author: "Mike Chen", role: "Freelancer" },
      { text: "The best investment we've made for our company this year.", author: "Emma Davis", role: "Marketing Director" }
    ];

    const title = embedConfig.title || 'What Our Customers Say';
    const description = embedConfig.description || `Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}`;
    const ctaText = embedConfig.ctaText || 'Join Our Happy Customers';

    const testimonialsHtml = `
      <section style="
        padding: 80px 24px;
        background: linear-gradient(135deg, #f9fafb, #ffffff);
        text-align: center;
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
        color: ${embedConfig.textColor || '#1f2937'};
      ">
        <div style="max-width: ${embedConfig.width || '1200px'}; margin: 0 auto;">
          <h2 style="
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            color: ${embedConfig.textColor || '#1f2937'};
          ">${title}</h2>
          
          <p style="
            font-size: 18px;
            color: ${embedConfig.textColor || '#6b7280'};
            margin: 0 0 48px 0;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">${description}</p>
          
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 32px;
            margin-bottom: 48px;
          ">
            ${testimonials.map(testimonial => `
              <div style="
                background: white;
                padding: 32px;
                border-radius: ${embedConfig.borderRadius || '16px'};
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid ${embedConfig.borderColor || '#e5e7eb'};
                transition: all 0.3s ease;
              "
              onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 25px rgba(0,0,0,0.1)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.05)'">
                <div style="
                  display: flex;
                  justify-content: center;
                  margin-bottom: 16px;
                ">
                  ${Array(testimonial.rating || 5).fill(0).map(() => `
                    <svg style="width: 20px; height: 20px; fill: #fbbf24; margin: 0 2px;" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  `).join('')}
                </div>
                
                <blockquote style="
                  font-size: 16px;
                  line-height: 1.6;
                  color: #374151;
                  margin: 0 0 24px 0;
                  font-style: italic;
                ">"${testimonial.text}"</blockquote>
                
                <div>
                  <div style="
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                  ">${testimonial.author}</div>
                  <div style="
                    font-size: 14px;
                    color: ${brandColor};
                  ">${testimonial.role}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <a href="${EnhancedEmbedGeneratorService.getPricingPageUrl(creator)}" 
             style="
               display: inline-flex;
               align-items: center;
               padding: 16px 32px;
               background: ${brandColor};
               color: white;
               text-decoration: none;
               border-radius: 8px;
               font-weight: 600;
               font-size: 18px;
               transition: all 0.3s ease;
             "
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            ${ctaText}
          </a>
        </div>
      </section>
    `;
    targetElement.innerHTML = testimonialsHtml;
  }

  function renderPricingTable(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const pricingUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`;
    
    const title = embedConfig.title || 'Choose Your Plan';
    const description = embedConfig.description || 'Find the perfect plan for your needs';
    const ctaText = embedConfig.ctaText || 'View All Plans';

    const pricingTableHtml = `
      <div style="
        padding: ${embedConfig.padding || '40px'};
        text-align: center;
        background: ${embedConfig.backgroundColor || 'linear-gradient(135deg, #f9fafb, #ffffff)'};
        border-radius: ${embedConfig.borderRadius || '12px'};
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin: ${embedConfig.margin || '16px auto'};
        max-width: ${embedConfig.width || '800px'};
        color: ${embedConfig.textColor || '#1f2937'};
      ">
        <h3 style="
          color: ${brandColor};
          margin: 0 0 24px 0;
          font-size: 28px;
          font-weight: 700;
        ">${title}</h3>
        <p style="
          color: ${embedConfig.textColor || '#6b7280'};
          margin: 0 0 32px 0;
          font-size: 16px;
        ">${description}</p>
        <a href="${pricingUrl}" 
           target="_blank"
           rel="noopener noreferrer"
           style="
             background: ${brandColor};
             color: white;
             padding: 16px 32px;
             border-radius: 8px;
             text-decoration: none;
             font-weight: 600;
             font-size: 18px;
             display: inline-block;
             transition: all 0.2s ease;
           "
           onmouseover="this.style.transform='scale(1.05)'"
           onmouseout="this.style.transform='scale(1)'"
           >
          ${ctaText}
        </a>
      </div>
    `;
    targetElement.innerHTML = pricingTableHtml;
  }

  function renderFooter(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const homeUrl = `${getBaseUrl()}/c/${creator.page_slug}`;
    
    const title = embedConfig.title || creator.business_name || 'Brand';
    const copyrightText = embedConfig.copyrightText || `© ${new Date().getFullYear()} All rights reserved.`;
    const ctaText = embedConfig.ctaText || 'Get Started Today';

    const footerHtml = `
      <footer style="
        background: ${embedConfig.backgroundColor || '#1f2937'};
        color: ${embedConfig.textColor || 'white'};
        padding: ${embedConfig.padding || '40px 24px 24px'};
        text-align: center;
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
      ">
        <div style="max-width: ${embedConfig.width || '1200px'}; margin: 0 auto;">
          <h3 style="color: ${brandColor}; margin-bottom: 16px; font-size: 24px; font-weight: 700;">${title}</h3>
          <p style="color: ${embedConfig.textColor || '#9ca3af'}; margin-bottom: 24px; font-size: 14px;">${copyrightText}</p>
          <a href="${homeUrl}" style="
            color: ${brandColor};
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.textDecoration='underline'"
          onmouseout="this.style.textDecoration='none'">
            ${ctaText}
          </a>
        </div>
      </footer>
    `;
    targetElement.innerHTML = footerHtml;
  }

  function renderTrialEmbed(targetElement, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const isExpired = new Date() > new Date(embedConfig.trialEndDate || 0);
    const daysRemaining = Math.ceil((new Date(embedConfig.trialEndDate || 0).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const subscriptionUrl = embedConfig.expiredCallToAction?.subscriptionUrl || `${getBaseUrl()}/c/${creator.page_slug}/pricing`;

    const trialHtml = `
      <div style="
        max-width: ${embedConfig.width || '400px'};
        margin: 0 auto;
        padding: ${embedConfig.padding || '24px'};
        border-radius: ${embedConfig.borderRadius || '12px'};
        font-family: ${embedConfig.fontFamily || 'sans-serif'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
        background-color: ${isExpired ? '#fef2f2' : '#ecfdf5'};
        border: 2px solid ${isExpired ? '#ef4444' : '#10b981'};
        color: ${isExpired ? '#991b1b' : '#065f46'};
      ">
        ${isExpired ? `
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #ef4444;">
            ${embedConfig.expiredCallToAction?.title || 'Trial Expired!'}
          </h3>
          <p style="font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            ${embedConfig.expiredCallToAction?.description || 'Your free trial has ended. Subscribe now to continue enjoying all features.'}
          </p>
          <a href="${subscriptionUrl}" 
             target="_blank"
             rel="noopener noreferrer"
             style="
               display: inline-block;
               background: #ef4444;
               color: white;
               padding: 10px 20px;
               border-radius: 8px;
               text-decoration: none;
               font-weight: 600;
               transition: all 0.2s ease;
             ">
            ${embedConfig.expiredCallToAction?.buttonText || 'Subscribe Now'}
          </a>
        ` : `
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #10b981;">
            FREE TRIAL ACTIVE!
          </h3>
          <p style="font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            ${daysRemaining > 0 ? `You have <strong>${daysRemaining} days</strong> remaining in your free trial.` : 'Your trial ends today!'}
          </p>
          <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; text-align: left;">
            ${(embedConfig.trialFeatures || ['Full access', 'Premium support']).map(feature => `
              <li style="display: flex; align-items: center; font-size: 14px; margin-bottom: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; flex-shrink: 0;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${feature}
              </li>
            `).join('')}
          </ul>
          <a href="${subscriptionUrl}" 
             target="_blank"
             rel="noopener noreferrer"
             style="
               display: inline-block;
               background: ${brandColor};
               color: white;
               padding: 10px 20px;
               border-radius: 8px;
               text-decoration: none;
               font-weight: 600;
               transition: all 0.2s ease;
             ">
            Upgrade Now
          </a>
        `}
      </div>
    `;
    targetElement.innerHTML = trialHtml;
  }

  function renderCustomEmbed(targetElement, embedConfig) {
    targetElement.innerHTML = embedConfig.customHtml || '<div>Custom Embed Content</div>';
    if (embedConfig.customCss) {
      const style = document.createElement('style');
      style.textContent = embedConfig.customCss;
      targetElement.appendChild(style);
    }
    if (embedConfig.customJs) {
      const script = document.createElement('script');
      script.textContent = embedConfig.customJs;
      targetElement.appendChild(script);
    }
  }

  // --- Main Embed Logic ---

  const scripts = document.querySelectorAll('script[data-creator-id][data-embed-type]');

  scripts.forEach(script => {
    const creatorId = script.getAttribute('data-creator-id');
    const embedType = script.getAttribute('data-embed-type');
    const productId = script.getAttribute('data-product-id');
    const assetId = script.getAttribute('data-asset-id'); // New: assetId for specific embeds
    
    // Validate configuration
    const configErrors = validateEmbedConfiguration(script);
    if (configErrors.length > 0) {
      console.error('SaaSinaSnap Embed: Configuration errors:', configErrors);
      
      const targetElementId = embedType === 'trial_embed' || embedType === 'custom'
        ? `saasinasnap-embed-${embedType}-${assetId}` 
        : `saasinasnap-embed-${embedType}${productId ? `-${productId}` : ''}`;
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        renderErrorState(targetElement, `Configuration error: ${configErrors.join(', ')}`);
      }
      return;
    }

    const targetElementId = embedType === 'trial_embed' || embedType === 'custom'
      ? `saasinasnap-embed-${embedType}-${assetId}` 
      : `saasinasnap-embed-${embedType}${productId ? `-${productId}` : ''}`;
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`SaaSinaSnap Embed: Target div with id '${targetElementId}' not found.`);
      return;
    }

    // Add embed container class for styling isolation
    targetElement.className = (targetElement.className || '') + ' saasinasnap-embed-container';
    
    // Show loading state
    renderLoadingState(targetElement);

    // PostHog: Capture embed impression event
    if (window.posthog) {
      window.posthog.capture('embed_viewed', {
        creator_id: creatorId,
        product_id: productId,
        embed_type: embedType,
        embed_id: targetElement.id,
        current_url: window.location.href,
        referrer: document.referrer,
      });
    }

    // Determine API endpoint based on embed type
    let apiEndpoint;
    if (embedType === 'trial_embed' || embedType === 'custom') {
      apiEndpoint = `${getBaseUrl()}/api/embed/asset-config/${creatorId}/${assetId}`;
    } else {
      apiEndpoint = `${getBaseUrl()}/api/embed/product/${creatorId}/${productId}`;
    }

    // Fetch embed configuration and creator profile
    fetch(apiEndpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        const { creator, product, embedConfig } = data;

        if (!creator) {
          throw new Error('Creator data not found');
        }

        // Enhanced environment-aware display with non-intrusive indicators
        const environment = detectEnvironment(embedConfig?.stripePublishableKey, product, creator);
        const embedId = targetElement.id || ('embed-' + Math.random().toString(36).substr(2, 9));
        targetElement.id = embedId;

        // Configure environment indicator
        const indicatorConfig = {
          show: environment === 'test' || (embedConfig && embedConfig.showEnvironmentIndicator),
          position: embedConfig?.environmentIndicator?.position || 'top-right',
          opacity: embedConfig?.environmentIndicator?.opacity || 0.8
        };

        // Create and add environment indicator
        const indicator = createEnvironmentIndicator(environment, embedId, indicatorConfig);
        if (indicator) {
          // Make container relative positioned to contain absolute indicator
          targetElement.style.position = 'relative';
          targetElement.appendChild(indicator);
        }

        // Legacy support: Add environment notices if configured
        if (embedConfig && embedConfig.environment) {
          // Add environment indicator for test mode
          if (embedConfig.environment === 'test' && embedConfig.testModeNotice) {
            const testNotice = document.createElement('div');
            testNotice.style.cssText = `
              background: #fef3c7;
              border: 1px solid #f59e0b;
              color: #92400e;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              margin-bottom: 12px;
              text-align: center;
            `;
            testNotice.textContent = embedConfig.testModeNotice;
            targetElement.appendChild(testNotice);
          }

          // Add production indicator for live mode
          if (embedConfig.environment === 'production' && embedConfig.showLiveIndicator) {
            const liveIndicator = document.createElement('div');
            liveIndicator.style.cssText = `
              background: #d1fae5;
              border: 1px solid #10b981;
              color: #065f46;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              display: inline-block;
              margin-bottom: 8px;
            `;
            liveIndicator.textContent = '✓ Live';
            targetElement.appendChild(liveIndicator);
          }
        }

        // Render based on embed type and fetched config
        switch (embedType) {
          case 'product_card':
            renderProductCard(targetElement, product, creator, embedConfig);
            break;
          case 'checkout_button':
            renderCheckoutButton(targetElement, product, creator, embedConfig, product.stripe_price_id);
            break;
          case 'header':
            renderHeader(targetElement, creator, embedConfig);
            break;
          case 'hero_section':
            renderHeroSection(targetElement, creator, embedConfig);
            break;
          case 'product_description':
            renderProductDescription(targetElement, product, creator, embedConfig);
            break;
          case 'testimonial_section':
            renderTestimonialSection(targetElement, creator, embedConfig);
            break;
          case 'footer':
            renderFooter(targetElement, creator, embedConfig);
            break;
          case 'pricing_table':
            renderPricingTable(targetElement, creator, embedConfig);
            break;
          case 'trial_embed':
            renderTrialEmbed(targetElement, creator, embedConfig);
            break;
          case 'custom':
            renderCustomEmbed(targetElement, embedConfig);
            break;
          default:
            renderErrorState(targetElement, `Unknown embed type: ${embedType}. Please check your configuration.`);
        }
      })
      .catch(error => {
        console.error('SaaSinaSnap Embed: Error fetching embed data:', error);
        renderErrorState(targetElement, `Failed to load embed: ${error.message}`);
      });
  });
})();