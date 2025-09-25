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
        console.warn('PayLift Embed: Could not determine base URL from script source');
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
      brandColor = '#3b82f6'; // Default blue
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
    
    // Check for business name
    if (creator.business_name) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Check for business description
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
    
    if (!creatorId || creatorId.trim() === '') {
      errors.push('data-creator-id is required');
    }
    
    if (!embedType || embedType.trim() === '') {
      errors.push('data-embed-type is required');
    }
    
    const validEmbedTypes = [
      'card', 'checkout-button', 'header', 'hero_section', 
      'product_description', 'testimonial_section', 'footer', 'pricing_table', 'trial_embed'
    ];
    
    if (embedType && !validEmbedTypes.includes(embedType)) {
      errors.push(`Invalid embed type: ${embedType}. Valid types: ${validEmbedTypes.join(', ')}`);
    }
    
    if ((embedType === 'card' || embedType === 'checkout-button' || embedType === 'product_description') && !productId) {
      errors.push(`${embedType} embed requires data-product-id attribute`);
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
          <strong>PayLift Embed Error</strong>
        </div>
        <div>${message}</div>
      </div>
    `;
    targetElement.innerHTML = errorHtml;
  }

  // Function to render loading state
  function renderLoadingState(targetElement, brandColor = '#3b82f6') {
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

  function renderProductCard(targetElement, product, creator, brandAlignment = 0) {
    const brandColor = creator.brand_color || '#3b82f6';
    const gradientCss = generateGradientCss(brandColor);
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    // Features (hardcoded for simplicity in embed, could be dynamic from product metadata)
    const features = [
      'Full access to all features',
      '24/7 customer support',
      'Cancel anytime',
    ];

    const embedId = `paylift-embed-card-${product.id}`;
    
    // Add scoped styles for better isolation
    const cardStyles = `
      .paylift-card {
        position: relative;
        display: flex;
        flex-direction: column;
        border-width: 2px;
        border-style: solid;
        border-color: ${brandColor};
        border-radius: 0.5rem;
        background-color: #ffffff;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 320px;
        margin: 0 auto;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .paylift-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 8px -1px rgba(0, 0, 0, 0.1);
      }
    `;

    injectEmbedStyles(embedId, cardStyles);

    const productCardHtml = `
      <div class="paylift-card" id="${embedId}">
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <h3 style="
            margin-bottom: 0.5rem;
            font-size: 1.25rem;
            line-height: 1.75rem;
            font-weight: 700;
            background: ${gradientCss};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: ${brandColor};
          ">
            ${product.name}
          </h3>
          ${product.description ? `<p style="margin-bottom: 1rem; font-size: 0.875rem; line-height: 1.25rem; color: #4b5563;">${product.description}</p>` : ''}
          <div style="display: flex; align-items: baseline; justify-content: center;">
            <span style="font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; color: #111827;">
              ${formatPrice(product.price, product.currency)}
            </span>
            <span style="margin-left: 0.25rem; color: #4b5563;">
              ${getPriceLabel(product.product_type)}
            </span>
          </div>
        </div>

        <ul style="margin-bottom: 1.5rem; flex: 1; padding-left: 0; list-style: none; text-align: left;">
          ${features.map(feature => `
            <li style="display: flex; align-items: center; font-size: 0.875rem; line-height: 1.25rem; color: #4b5563; margin-bottom: 0.75rem;">
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
            border-radius: 0.5rem;
            padding: 0.75rem 1.5rem;
            text-align: center;
            font-weight: 600;
            color: #ffffff;
            background: ${gradientCss};
            transition: all 0.2s ease-in-out;
            text-decoration: none;
            border: none;
            cursor: pointer;
          "
          onmouseover="this.style.transform='scale(1.02)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          Get Started
        </a>
        
        <!-- Brand alignment indicator (hidden, for metadata) -->
        <div style="display: none;" data-brand-alignment="${brandAlignment.toFixed(2)}"></div>
      </div>
    `;
    targetElement.innerHTML = productCardHtml;
  }

  function renderCheckoutButton(targetElement, product, creator, stripePriceId, brandAlignment = 0) {
    const brandColor = creator.brand_color || '#3b82f6';
    const gradientCss = generateGradientCss(brandColor);

    const button = document.createElement('button');
    button.textContent = `Buy ${product.name} - ${formatPrice(product.price, product.currency)}`;
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      text-align: center;
      font-weight: 600;
      color: #ffffff;
      background: ${gradientCss};
      border: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 1rem;
      line-height: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `;

    // Enhanced interaction states
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

    // Store original text and brand alignment for metadata
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
        
        window.location.href = checkoutUrl; // Redirect to Stripe Checkout
      } catch (error) {
        console.error('PayLift Embed: Error creating checkout session:', error);
        
        // Show user-friendly error message
        const errorMsg = error.message.includes('HTTP') 
          ? 'Service temporarily unavailable. Please try again.' 
          : 'Failed to initiate checkout. Please try again.';
          
        alert(errorMsg);
        
        // Restore button state
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    });

    targetElement.innerHTML = ''; // Clear existing content
    targetElement.appendChild(button);
  }

  function renderHeader(targetElement, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const gradientCss = generateGradientCss(brandColor);
    const homeUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}`;
    const pricingUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    const headerHtml = `
      <header style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background-color: #ffffff; /* Default background */
        border-bottom: 1px solid #e5e7eb; /* Default border */
        font-family: sans-serif;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      ">
        <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: flex; align-items: center;">
          ${creator.business_logo_url ? `
            <img src="${creator.business_logo_url}" alt="${creator.business_name || 'Business Logo'}" style="height: 2.5rem; width: auto; margin-right: 0.5rem;" />
          ` : `
            <div style="font-size: 1.5rem; font-weight: 700; color: ${brandColor};">
              ${creator.business_name || 'SaaS Platform'}
            </div>
          `}
        </a>
        
        <nav style="display: flex; align-items: center; gap: 1.5rem;">
          <a href="${homeUrl}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none; font-weight: 500; transition: color 0.2s ease-in-out;">
            Home
          </a>
          <a href="${pricingUrl}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none; font-weight: 500; transition: color 0.2s ease-in-out;">
            Pricing
          </a>
          <a 
            href="${pricingUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.5rem;
              padding: 0.5rem 1rem;
              text-align: center;
              font-weight: 600;
              color: #ffffff;
              background: ${gradientCss};
              transition: all 0.2s ease-in-out;
              text-decoration: none;
              font-size: 0.875rem;
            "
          >
            Get Started
          </a>
        </nav>
      </header>
    `;
    targetElement.innerHTML = headerHtml;
  }

  // --- Enhanced Render Functions for new embed types ---

  function renderHeroSection(targetElement, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const title = creator.business_name ? `Welcome to ${creator.business_name}` : 'Welcome to Our Platform';
    const description = creator.business_description || 'Discover amazing products and services tailored for you.';
    const homeUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}`;
    const pricingUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    const heroHtml = `
      <section style="
        background: linear-gradient(135deg, ${brandColor}15, ${brandColor}05);
        padding: 80px 24px;
        text-align: center;
        min-height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        font-family: sans-serif;
      ">
        <div style="max-width: 800px; position: relative; z-index: 2;">
          <h1 style="
            font-size: clamp(32px, 5vw, 56px);
            font-weight: 800;
            margin: 0 0 24px 0;
            line-height: 1.2;
            background: linear-gradient(45deg, ${brandColor}, ${brandColor}80);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: ${brandColor};
          ">${title}</h1>
          
          <p style="
            font-size: clamp(18px, 2.5vw, 24px);
            color: #4b5563;
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
              Get Started
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
      </section>
    `;
    
    targetElement.innerHTML = heroHtml;
  }

  function renderProductDescription(targetElement, product, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    const descriptionHtml = `
      <div style="
        max-width: 600px;
        padding: 32px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-family: sans-serif;
        margin: 16px;
      ">
        <h2 style="
          color: ${brandColor};
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        ">${product.name}</h2>
        
        <p style="
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-size: 16px;
        ">${product.description || 'Experience the best with our premium offering designed to meet all your needs.'}</p>
        
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
          Learn More
        </a>
      </div>
    `;
    
    targetElement.innerHTML = descriptionHtml;
  }

  function renderTestimonialSection(targetElement, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;
    
    const testimonials = [
      { text: "This platform has transformed how we do business. Highly recommended!", author: "Sarah Johnson", role: "CEO, TechCorp" },
      { text: "Amazing customer support and great value for money.", author: "Mike Chen", role: "Freelancer" },
      { text: "The best investment we've made for our company this year.", author: "Emma Davis", role: "Marketing Director" }
    ];

    const testimonialsHtml = `
      <section style="
        padding: 80px 24px;
        background: linear-gradient(135deg, #f9fafb, #ffffff);
        text-align: center;
        font-family: sans-serif;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="
            font-size: 36px;
            font-weight: 800;
            margin: 0 0 16px 0;
            color: #1f2937;
          ">What Our Customers Say</h2>
          
          <p style="
            font-size: 18px;
            color: #6b7280;
            margin: 0 0 48px 0;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          ">Join thousands of satisfied customers who trust ${creator.business_name || 'our platform'}</p>
          
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 32px;
            margin-bottom: 48px;
          ">
            ${testimonials.map(testimonial => `
              <div style="
                background: white;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
              ">
                <div style="
                  display: flex;
                  justify-content: center;
                  margin-bottom: 16px;
                ">
                  ${'★'.repeat(5).split('').map(() => `
                    <span style="color: #fbbf24; margin: 0 2px;">★</span>
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
          
          <a href="${pricingPageUrl}" 
             target="_blank"
             rel="noopener noreferrer"
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
             ">
            Join Our Happy Customers
          </a>
        </div>
      </section>
    `;
    
    targetElement.innerHTML = testimonialsHtml;
  }

  function renderFooter(targetElement, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    const footerHtml = `
      <footer style="
        background: #1f2937;
        color: white;
        padding: 40px 24px 24px;
        text-align: center;
        font-family: sans-serif;
      ">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h3 style="
            color: ${brandColor};
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 700;
          ">${creator.business_name || 'Brand'}</h3>
          
          <p style="
            color: #9ca3af;
            margin: 0 0 24px 0;
          ">© ${new Date().getFullYear()} All rights reserved.</p>
          
          <a href="${pricingPageUrl}" 
             target="_blank"
             rel="noopener noreferrer"
             style="
               color: ${brandColor};
               text-decoration: none;
               font-weight: 600;
             ">
            Get Started Today
          </a>
        </div>
      </footer>
    `;
    
    targetElement.innerHTML = footerHtml;
  }

  function renderTrialEmbed(targetElement, embedData, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
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
          
          <a href="${getBaseUrl()}${expiredConfig?.subscriptionUrl || `/c/${creator.custom_domain || creator.id}/pricing`}"
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

  // --- Enhanced Main Embed Logic ---

  const scripts = document.querySelectorAll('script[data-creator-id][data-embed-type]');

  scripts.forEach(script => {
    const creatorId = script.getAttribute('data-creator-id');
    const embedType = script.getAttribute('data-embed-type');
    const productId = script.getAttribute('data-product-id');
    const stripePriceId = script.getAttribute('data-stripe-price-id');

    // Validate configuration
    const configErrors = validateEmbedConfiguration(script);
    if (configErrors.length > 0) {
      console.error('PayLift Embed: Configuration errors:', configErrors);
      
      const targetElementId = embedType === 'trial_embed' 
        ? `paylift-embed-${embedType}-${script.getAttribute('data-embed-id')}` 
        : `paylift-embed-${embedType}${productId ? `-${productId}` : ''}`;
      const targetElement = document.getElementById(targetElementId);
      if (targetElement) {
        renderErrorState(targetElement, `Configuration error: ${configErrors.join(', ')}`);
      }
      return;
    }

    const targetElementId = embedType === 'trial_embed' 
      ? `paylift-embed-${embedType}-${script.getAttribute('data-embed-id')}` 
      : `paylift-embed-${embedType}${productId ? `-${productId}` : ''}`;
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`PayLift Embed: Target div with id '${targetElementId}' not found.`);
      return;
    }

    // Add embed container class for styling isolation
    targetElement.className = (targetElement.className || '') + ' paylift-embed-container';
    
    // Show loading state
    renderLoadingState(targetElement);

    if (embedType === 'card' || embedType === 'checkout-button') {
      // The product ID validation is now handled in validateEmbedConfiguration
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
          const brandAlignment = calculateBrandAlignment(creator);
          
          if (embedType === 'card') {
            renderProductCard(targetElement, product, creator, brandAlignment);
          } else if (embedType === 'checkout-button') {
            if (!stripePriceId) {
              throw new Error('Checkout button embed missing data-stripe-price-id attribute');
            }
            renderCheckoutButton(targetElement, product, creator, stripePriceId, brandAlignment);
          }
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching product data:', error);
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
          if (!creator) {
            throw new Error('Creator data not found for header');
          }
          renderHeader(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for header:', error);
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
          if (!creator) {
            throw new Error('Creator data not found for hero section');
          }
          renderHeroSection(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for hero section:', error);
          renderErrorState(targetElement, `Failed to load hero section: ${error.message}`);
        });
    } else if (embedType === 'product_description') {
      // productId validation is now handled in validateEmbedConfiguration
      fetch(`${getBaseUrl()}/api/embed/product/${creatorId}/${productId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          const { product, creator } = data;
          if (!product || !creator) {
            throw new Error('Product or creator data not found');
          }
          renderProductDescription(targetElement, product, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching product data for description:', error);
          renderErrorState(targetElement, `Failed to load product description: ${error.message}`);
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
          if (!creator) {
            throw new Error('Creator data not found for testimonials');
          }
          renderTestimonialSection(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for testimonials:', error);
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
          if (!creator) {
            throw new Error('Creator data not found for footer');
          }
          renderFooter(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for footer:', error);
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
          const brandColor = creator.brand_color || '#3b82f6';
          const pricingUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;
          
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
          console.error('PayLift Embed: Error fetching pricing data:', error);
          renderErrorState(targetElement, `Failed to load pricing table: ${error.message}`);
        });
    } else if (embedType === 'trial_embed') {
      // Get trial embed data
      const embedId = script.getAttribute('data-embed-id');
      const trialEnd = script.getAttribute('data-trial-end');
      
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
          renderTrialEmbed(targetElement, embedData, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching trial embed data:', error);
          renderErrorState(targetElement, `Failed to load trial embed: ${error.message}`);
        });
    } else {
      renderErrorState(targetElement, `Unknown embed type: ${embedType}. Please check your configuration.`);
    }
  });
})();