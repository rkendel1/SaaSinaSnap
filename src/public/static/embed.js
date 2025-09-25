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
          ${embedConfig.showDescription && (embedConfig.content?.description || product.description) ? `<p style="margin-bottom: 1rem; font-size: 0.875rem; line-height: 1.25rem; color: ${embedConfig.textColor || '#4b5563'}; opacity: 0.8;">${embedConfig.content?.description || product.description}</p>` : ''}
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
              color: ${embedConfig.buttonTextColor || '#ffffff'};
              background: ${embedConfig.buttonColor || gradientCss};
              border: ${embedConfig.buttonStyle === 'outline' ? `2px solid ${brandColor}` : 'none'};
              transition: all 0.2s ease-in-out;
              text-decoration: none;
              font-size: 0.875rem;
            "
          >
            ${embedConfig.content?.ctaText || 'Get Started'}
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

    const title = embedConfig.content?.title || creator.business_name ? `Welcome to ${creator.business_name}` : 'Welcome to SaaSinaSnap';
    const description = embedConfig.content?.description || creator.business_description || 'SaaS in a Snap - Get your business running quickly and efficiently.';
    const ctaText = embedConfig.content?.ctaText || 'Get Started';

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
        font-family: ${embedConfig.fonts?.[0] || 'sans-serif'};
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

    const embedCode = this.generateEmbedCode(creator.id, 'hero_section');

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
          ...(customization?.voiceAndTone ? ['voice-tone-adaptation'] : []),
          ...(customization?.content ? ['custom-content'] : [])
        ]
      }
    };
  }

  function renderProductDescription(targetElement, product, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea5800c';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`; // Use creator.page_slug

    const title = embedConfig.content?.title || product.name;
    const description = embedConfig.content?.description || product.description || 'Experience the best with our premium offering designed to meet all your needs.';
    const ctaText = embedConfig.content?.ctaText || 'Learn More';

    const descriptionHtml = `
      <div style="
        max-width: ${embedConfig.width || '600px'};
        padding: ${embedConfig.padding || '32px'};
        background: ${embedConfig.backgroundColor || 'white'};
        border-radius: ${embedConfig.borderRadius || '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: ${embedConfig.fonts?.[0] || 'sans-serif'};
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
    
    const testimonials = embedConfig.content?.testimonials || [
      { text: "This platform has transformed how we do business. Highly recommended!", author: "Sarah Johnson", role: "CEO, TechCorp" },
      { text: "Amazing customer support and great value for money.", author: "Mike Chen", role: "Freelancer" },
      { text: "The best investment we've made for our company this year.", author: "Emma Davis", role: "Marketing Director" }
    ];

    const title = embedConfig.content?.title || 'What Our Customers Say';
    const description = embedConfig.content?.description || `Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}`;
    const ctaText = embedConfig.content?.ctaText || 'Join Our Happy Customers';

    const testimonialsHtml = `
      <section style="
        padding: 80px 24px;
        background: linear-gradient(135deg, #f9fafb, #ffffff);
        text-align: center;
        font-family: ${embedConfig.fonts?.[0] || 'sans-serif'};
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
                    color: ${brandingStyles.brandColor};
                  ">${testimonial.role}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <a href="${pricingPageUrl}" 
             style="
               display: inline-flex;
               align-items: center;
               padding: 16px 32px;
               background: ${brandingStyles.brandColor};
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

    const css = `
      @media (max-width: 768px) {
        section {
          padding: 60px 16px !important;
        }
        section > div > div {
          grid-template-columns: 1fr !important;
        }
      }
    `;

    const embedCode = this.generateEmbedCode(creator.id, 'testimonial_section');

    return {
      html,
      css,
      embedCode,
      metadata: {
        type: 'testimonial_section',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          'responsive-grid',
          'hover-effects',
          'star-ratings',
          ...(customization?.content?.testimonials ? ['custom-testimonials'] : [])
        ]
      }
    };
  }

  /**
   * Generate other embed types (simplified for brevity)
   */
  function generateCheckoutButton(options, brandingStyles) {
    const { creator, product, customization } = options;
    
    if (!product) throw new Error('Product required for checkout button');

    const html = `
      <button onclick="window.open('${getPricingPageUrl(creator)}', '_blank')" style="
        background: ${brandingStyles.brandColor};
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ${customization?.content?.ctaText || `Buy ${product.name} - ${formatPrice(product.price || 0, product.currency || 'USD')}`}
      </button>
    `;

    return {
      html,
      css: '',
      embedCode: generateEmbedCode(creator.id, 'checkout_button', product.id),
      metadata: {
        type: 'checkout_button',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'hover-effects',
          ...(customization?.content?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  function generatePricingTable(options, brandingStyles) {
    // Simplified pricing table implementation
    const { creator, customization } = options;
    
    const html = `
      <div style="padding: 40px; text-align: center; background: #f9fafb; border-radius: 12px;">
        <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 24px;">${customization?.content?.title || 'Choose Your Plan'}</h3>
        <a href="${getPricingPageUrl(creator)}" style="
          background: ${brandingStyles.brandColor};
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        ">${customization?.content?.ctaText || 'View All Plans'}</a>
      </div>
    `;

    return {
      html,
      css: '',
      embedCode: generateEmbedCode(creator.id, 'pricing_table'),
      metadata: {
        type: 'pricing_table',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors',
          ...(customization?.content?.title ? ['custom-title'] : []),
          ...(customization?.content?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  function generateProductDescription(options, brandingStyles) {
    const { creator, product, customization } = options;
    
    if (!product) throw new Error('Product required for product description');

    const html = `
      <div style="max-width: 600px; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: ${brandingStyles.brandColor}; margin-bottom: 16px;">${customization?.content?.title || product.name}</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 24px;">${customization?.content?.description || product.description || 'Experience the best with our premium offering.'}</p>
        <a href="${getPricingPageUrl(creator)}" style="
          background: ${brandingStyles.brandColor};
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">${customization?.content?.ctaText || 'Learn More'}</a>
      </div>
    `;

    return {
      html,
      css: '',
      embedCode: generateEmbedCode(creator.id, 'product_description', product.id),
      metadata: {
        type: 'product_description',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'content-styling',
          ...(customization?.content?.title ? ['custom-title'] : []),
          ...(customization?.content?.description ? ['custom-description'] : []),
          ...(customization?.content?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  function generateFooter(options, brandingStyles) {
    const { creator, customization } = options;
    
    const html = `
      <footer style="
        background: #1f2937;
        color: white;
        padding: 40px 24px 24px;
        text-align: center;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h3 style="color: ${brandingStyles.brandColor}; margin-bottom: 16px;">${customization?.content?.title || creator.business_name || 'Brand'}</h3>
          <p style="color: #9ca3af; margin-bottom: 24px;">© ${new Date().getFullYear()} All rights reserved.</p>
          <a href="${getPricingPageUrl(creator)}" style="
            color: ${brandingStyles.brandColor};
            text-decoration: none;
            font-weight: 600;
          ">${customization?.content?.ctaText || 'Get Started Today'}</a>
        </div>
      </footer>
    `;

    return {
      html,
      css: '',
      embedCode: generateEmbedCode(creator.id, 'footer'),
      metadata: {
        type: 'footer',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: [
          'brand-colors', 
          'dark-theme',
          ...(customization?.content?.title ? ['custom-title'] : []),
          ...(customization?.content?.ctaText ? ['custom-cta-text'] : [])
        ]
      }
    };
  }

  function generateCustomEmbed(options, brandingStyles) {
    const { customization } = options;
    
    const html = customization?.customHtml || '<div>Custom embed content</div>';
    const css = customization?.customCss || '';
    const js = customization?.customJs || '';

    return {
      html,
      css,
      javascript: js,
      embedCode: '', // Custom embeds don't have a standard embedCode generated by this service
      metadata: {
        type: 'custom',
        generatedAt: new Date().toISOString(),
        brandAlignment: 0,
        customizations: ['custom-html', 'custom-css', 'custom-js']
      }
    };
  }

  /**
   * Helper methods
   */
  function generateAutoGradient(primaryColor) {
    return {
      type: 'linear',
      colors: [primaryColor, `${primaryColor}80`],
      direction: 45
    };
  }

  function formatPrice(price, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }

  function getPriceLabel(productType) {
    switch (productType) {
      case 'subscription': return '/month';
      case 'usage_based': return '/usage';
      default: return '';
    }
  }

  function getPricingPageUrl(creator) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}/pricing`;
  }

  function getHomeUrl(creator) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}`;
  }

  function getAboutUrl(creator) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://paylift.com';
    return `${baseUrl}/c/${creator.page_slug}/about`;
  }

  function generateEmbedCode(creatorId, embedType, productId) {
    const attributes = [
      `data-creator-id="${creatorId}"`,
      `data-embed-type="${embedType}"`,
      ...(productId ? [`data-product-id="${productId}"`] : [])
    ].join(' ');

    return `<script src="https://paylift.com/embed.js" ${attributes}></script>`;
  }

  function calculateBrandAlignment(creator, embed) {
    let score = 0.5; // base score

    // Check if embed uses creator's brand color
    if (embed.html.includes(creator.brand_color || '#3b82f6')) {
      score += 0.3;
    }

    // Check if embed includes creator's business name
    if (creator.business_name && embed.html.includes(creator.business_name)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  // --- Enhanced Main Embed Logic ---

  const scripts = document.querySelectorAll('script[data-creator-id][data-embed-type]');

  scripts.forEach(script => {
    const creatorId = script.getAttribute('data-creator-id');
    const embedType = script.getAttribute('data-embed-type');
    const productId = script.getAttribute('data-product-id');
    const stripePriceId = script.getAttribute('data-stripe-price-id');
    const assetId = script.getAttribute('data-asset-id');

    // Validate configuration
    const configErrors = validateEmbedConfiguration(script);
    if (configErrors.length > 0) {
      console.error('SaaSinaSnap Embed: Configuration errors:', configErrors);
      
      const targetElementId = embedType === 'trial_embed' 
        ? `saasinasnap-embed-${embedType}-${script.getAttribute('data-embed-id')}` 
        : `saasinasnap-embed-${embedType}${productId ? `-${productId}` : ''}`;
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        renderErrorState(targetElement, `Configuration error: ${configErrors.join(', ')}`);
      }
      return;
    }

    const targetElementId = embedType === 'trial_embed' 
      ? `saasinasnap-embed-${embedType}-${script.getAttribute('data-embed-id')}` 
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

    if (embedType === 'product_card' || embedType === 'checkout_button' || embedType === 'product_description') {
      // Fetch product and creator data from the API
      fetch(`${getBaseUrl()}/api/embed/product/${creatorId}/${productId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const product = data.product;
          const creator = data.creator;

          if (!product || !creator) {
            throw new Error('Product or creator data not found in response');
          }

          // Calculate brand alignment for metadata
          const brandAlignment = calculateBrandAlignment(creator, {html: '', css: '', metadata: {type: embedType, generatedAt: new Date().toISOString(), brandAlignment: 0, customizations: []}});
          
          // Mock embedConfig for static embed.js rendering
          const embedConfig = {
            accentColor: creator.brand_color,
            backgroundColor: '#ffffff',
            textColor: '#111827',
            borderRadius: '0.5rem',
            buttonText: 'Get Started',
            buttonStyle: 'solid',
            showImage: true,
            showDescription: true,
            showPrice: true,
            imageUrl: product.image_url,
            content: {
              description: product.description
            }
          };

          if (embedType === 'product_card') {
            renderProductCard(targetElement, product, creator, embedConfig, brandAlignment);
          } else if (embedType === 'checkout_button') {
            if (!stripePriceId) {
              throw new Error('Checkout button embed missing data-stripe-price-id attribute');
            }
            renderCheckoutButton(targetElement, product, creator, embedConfig, stripePriceId, brandAlignment);
          } else if (embedType === 'product_description') {
            renderProductDescription(targetElement, product, creator, embedConfig);
          }
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching product data:', error);
          renderErrorState(targetElement, `Failed to load embed: ${error.message}`);
        });
    } else if (embedType === 'header') {
      // Fetch only creator data for the header
      fetch(`${getBaseUrl()}/api/embed/header/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          const embedConfig = data.embedData || {}; // Use embedData from API if available
          if (!creator) {
            throw new Error('Creator data not found for header');
          }
          renderHeader(targetElement, creator, embedConfig);
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching creator data for header:', error);
          renderErrorState(targetElement, `Failed to load header: ${error.message}`);
        });
    } else if (embedType === 'hero_section') {
      // Fetch creator data for hero section
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          // Mock embedConfig for static embed.js rendering
          const embedConfig = {
            accentColor: creator.brand_color,
            content: {
              title: creator.business_name ? `Welcome to ${creator.business_name}` : 'Welcome to SaaSinaSnap',
              description: creator.business_description || 'SaaS in a Snap - Get your business running quickly and efficiently.',
              ctaText: 'Get Started'
            }
          };
          if (!creator) {
            throw new Error('Creator data not found for hero section');
          }
          renderHeroSection(targetElement, creator, embedConfig);
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching creator data for hero section:', error);
          renderErrorState(targetElement, `Failed to load hero section: ${error.message}`);
        });
    } else if (embedType === 'testimonial_section') {
      // Fetch creator data for testimonials
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          // Mock embedConfig for static embed.js rendering
          const embedConfig = {
            accentColor: creator.brand_color,
            content: {
              title: 'What Our Customers Say',
              description: `Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}`,
              ctaText: 'Join Our Happy Customers'
            }
          };
          if (!creator) {
            throw new Error('Creator data not found for testimonials');
          }
          renderTestimonialSection(targetElement, creator, embedConfig);
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching creator data for testimonials:', error);
          renderErrorState(targetElement, `Failed to load testimonials: ${error.message}`);
        });
    } else if (embedType === 'footer') {
      // Fetch creator data for footer
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          // Mock embedConfig for static embed.js rendering
          const embedConfig = {
            accentColor: creator.brand_color,
            content: {
              title: creator.business_name || 'Brand',
              ctaText: 'Get Started Today'
            }
          };
          if (!creator) {
            throw new Error('Creator data not found for footer');
          }
          renderFooter(targetElement, creator, embedConfig);
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching creator data for footer:', error);
          renderErrorState(targetElement, `Failed to load footer: ${error.message}`);
        });
    } else if (embedType === 'pricing_table') {
      // Fetch creator and products data for pricing table
      fetch(`${getBaseUrl()}/api/embed/pricing/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const { creator, products } = data;
          if (!creator) {
            throw new Error('Creator data not found for pricing table');
          }
          
          // For now, render a simple pricing CTA until we implement full pricing table
          const brandColor = creator.brand_color || '#ea580c';
          const pricingUrl = `${getBaseUrl()}/c/${creator.page_slug}/pricing`;
          
          targetElement.innerHTML = `
            <div style="
              padding: 40px;
              text-align: center;
              background: linear-gradient(135deg, #f9fafb, #ffffff);
              border-radius: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              margin: 16px;
              transition: transform 0.2s ease;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
            >
              <h3 style="
                color: ${brandColor};
                margin: 0 0 24px 0;
                font-size: 28px;
                font-weight: 700;
              ">Choose Your Plan</h3>
              <p style="
                color: #6b7280;
                margin: 0 0 32px 0;
                font-size: 16px;
              ">Find the perfect plan for your needs</p>
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
                View All Plans
              </a>
            </div>
          `;
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching pricing data:', error);
          renderErrorState(targetElement, `Failed to load pricing table: ${error.message}`);
        });
    } else if (embedType === 'trial_embed') {
      // Get trial embed data
      const embedId = script.getAttribute('data-embed-id');
      
      if (!embedId) {
        renderErrorState(targetElement, 'Trial embed requires data-embed-id attribute');
        return;
      }
      
      // Fetch trial embed data
      fetch(`${getBaseUrl()}/api/embed/trial/${creatorId}/${embedId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const { creator, embedData } = data;
          if (!creator) {
            throw new Error('Creator data not found for trial embed');
          }
          if (!embedData) {
            throw new Error('Trial embed data not found');
          }
          // Mock embedConfig for static embed.js rendering
          const embedConfig = {
            accentColor: creator.brand_color,
            expiredCallToAction: embedData.expiredConfig,
            trialDurationDays: embedData.trialDurationDays,
            trialEndDate: embedData.trialEndDate,
            trialFeatures: embedData.trialFeatures
          };
          renderTrialEmbed(targetElement, embedData, creator, embedConfig);
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching trial embed data:', error);
          renderErrorState(targetElement, `Failed to load trial embed: ${error.message}`);
        });
    } else if (embedType === 'custom') {
      // Get custom embed data
      const assetId = script.getAttribute('data-asset-id');
      if (!assetId) {
        renderErrorState(targetElement, 'Custom embed requires data-asset-id attribute');
        return;
      }

      fetch(`${getBaseUrl()}/api/embed/asset/${assetId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const { asset } = data;
          if (!asset || asset.asset_type !== 'custom') {
            throw new Error('Custom embed asset not found or invalid type');
          }
          targetElement.innerHTML = asset.embed_config.customHtml || '';
          if (asset.embed_config.customCss) {
            const styleElement = document.createElement('style');
            styleElement.textContent = asset.embed_config.customCss;
            targetElement.appendChild(styleElement);
          }
          if (asset.embed_config.customJs) {
            const scriptElement = document.createElement('script');
            scriptElement.textContent = asset.embed_config.customJs;
            targetElement.appendChild(scriptElement);
          }
        })
        .catch(error => {
          console.error('SaaSinaSnap Embed: Error fetching custom embed data:', error);
          renderErrorState(targetElement, `Failed to load custom embed: ${error.message}`);
        });
    } else {
      renderErrorState(targetElement, `Unknown embed type: ${embedType}. Please check your configuration.`);
    }
  });

  // Helper function for rendering trial embeds (moved here to be accessible)
  function renderTrialEmbed(targetElement, embedData, creator, embedConfig) {
    const brandColor = embedConfig.accentColor || creator.brand_color || '#ea580c';
    const { isExpired, daysRemaining, expiredConfig, trialFeatures } = embedData;
    
    if (isExpired) {
      // Render expired state with call-to-action
      const expiredHtml = `
        <div style="
          max-width: 480px;
          margin: 0 auto;
          padding: 32px;
          text-align: center;
          border: 2px solid #fbbf24;
          border-radius: 12px;
          background: linear-gradient(135deg, #fef3c7, #ffffff);
          font-family: sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            width: 64px;
            height: 64px;
            background: #fbbf24;
            border-radius: 50%;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          ">⏰</div>
          
          <h3 style="
            color: #92400e;
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
          ">${expiredConfig?.title || 'Trial Expired'}</h3>
          
          <p style="
            color: #78350f;
            margin: 0 0 24px 0;
            font-size: 16px;
            line-height: 1.6;
          ">${expiredConfig?.description || 'Your free trial has ended. Subscribe now to continue accessing all features.'}</p>
          
          <a href="${getBaseUrl()}${expiredConfig?.subscriptionUrl || `/c/${creator.page_slug}/pricing`}"
             target="_blank"
             rel="noopener noreferrer"
             style="
               display: inline-block;
               padding: 16px 32px;
               background: ${brandColor};
               color: white;
               text-decoration: none;
               border-radius: 8px;
               font-weight: 600;
               font-size: 18px;
               transition: all 0.3s ease;
               box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
             "
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 0, 0, 0.3)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)';"
          >
            ${expiredConfig?.buttonText || 'Subscribe Now'}
          </a>
        </div>
      `;
      
      targetElement.innerHTML = expiredHtml;
    } else {
      // Render active trial state
      const features = trialFeatures || ['Full access to all features', '24/7 customer support', 'No commitment required'];
      const featuresHtml = features.map(feature => `
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          color: #065f46;
        ">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="margin-right: 12px; flex-shrink: 0;">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>${feature}</span>
        </div>
      `).join('');
      
      const trialHtml = `
        <div style="
          max-width: 480px;
          margin: 0 auto;
          padding: 32px;
          border: 2px solid #10b981;
          border-radius: 12px;
          background: linear-gradient(135deg, #d1fae5, #ffffff);
          font-family: sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            text-align: center;
            margin-bottom: 24px;
          ">
            <div style="
              display: inline-block;
              padding: 8px 16px;
              background: #10b981;
              color: white;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 16px;
            ">
              🎉 FREE TRIAL ACTIVE
            </div>
            
            <h3 style="
              color: #065f46;
              margin: 0 0 8px 0;
              font-size: 24px;
              font-weight: 700;
            ">Try ${creator.business_name || 'Our Service'} Free!</h3>
            
            <p style="
              color: #047857;
              margin: 0;
              font-size: 16px;
            ">
              ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your trial
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            ${featuresHtml}
          </div>
          
          <div style="
            text-align: center;
            padding: 16px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 8px;
            border: 1px solid #10b981;
          ">
            <p style="
              color: #065f46;
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: 600;
            ">No credit card required • Cancel anytime</p>
            <p style="
              color: #047857;
              margin: 0;
              font-size: 12px;
            ">Trial automatically ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</p>
          </div>
        </div>
      `;
      
      targetElement.innerHTML = trialHtml;
    }
  }
})();