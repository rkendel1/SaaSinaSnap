(function() {
  // Function to get the base URL dynamically
  function getBaseUrl() {
    // Assuming the embed.js is served from the same domain as the API
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

  // Function to generate a simple linear gradient CSS string
  function generateGradientCss(brandColor) {
    // A simple default gradient for the embed script
    return `linear-gradient(45deg, ${brandColor}, ${brandColor}80)`;
  }

  // --- Render Functions for different embed types ---

  function renderProductCard(targetElement, product, creator) {
    const brandColor = creator.brand_color || '#3b82f6';
    const gradientCss = generateGradientCss(brandColor);
    const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

    // Features (hardcoded for simplicity in embed, could be dynamic from product metadata)
    const features = [
      'Full access to all features',
      '24/7 customer support',
      'Cancel anytime',
    ];

    const productCardHtml = `
      <div style="
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
        font-family: sans-serif;
        max-width: 320px; /* Max width for embed */
        margin: 0 auto; /* Center the card */
      ">
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <h3 style="
            margin-bottom: 0.5rem;
            font-size: 1.25rem;
            line-height: 1.75rem;
            font-weight: 700;
            background: ${gradientCss};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
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
          "
        >
          Get Started
        </a>
      </div>
    `;
    targetElement.innerHTML = productCardHtml;
  }

  function renderCheckoutButton(targetElement, product, creator, stripePriceId) {
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
      font-family: sans-serif;
      font-size: 1rem;
      line-height: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `;

    button.onmouseover = () => { button.style.transform = 'scale(1.02)'; };
    button.onmouseout = () => { button.style.transform = 'scale(1)'; };
    button.onmousedown = () => { button.style.transform = 'scale(0.98)'; };
    button.onmouseup = () => { button.style.transform = 'scale(1.02)'; };


    button.addEventListener('click', async () => {
      button.textContent = 'Processing...';
      button.disabled = true;
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl; // Redirect to Stripe Checkout
      } catch (error) {
        console.error('PayLift Embed: Error creating checkout session:', error);
        alert('Failed to initiate checkout. Please try again.');
        button.textContent = `Buy ${product.name} - ${formatPrice(product.price, product.currency)}`;
        button.disabled = false;
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

  // --- Main Embed Logic ---

  const scripts = document.querySelectorAll('script[data-creator-id][data-embed-type]');

  scripts.forEach(script => {
    const creatorId = script.getAttribute('data-creator-id');
    const embedType = script.getAttribute('data-embed-type');
    const productId = script.getAttribute('data-product-id'); // Only for product/checkout embeds
    const stripePriceId = script.getAttribute('data-stripe-price-id'); // Only for checkout button

    if (!creatorId || !embedType) {
      console.error('PayLift Embed: Script tag missing required attributes (data-creator-id, data-embed-type).');
      return;
    }

    const targetElementId = `paylift-embed-${embedType}${productId ? `-${productId}` : ''}`;
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`PayLift Embed: Target div with id '${targetElementId}' not found.`);
      return;
    }

    if (embedType === 'card' || embedType === 'checkout-button') {
      if (!productId) {
        console.error(`PayLift Embed: ${embedType} embed missing data-product-id attribute.`);
        targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Configuration error: Missing product ID.</p>';
        return;
      }
      // Fetch product and creator data from the API
      fetch(`${getBaseUrl()}/api/embed/product/${productId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const product = data.product;
          const creator = data.creator;

          if (!product || !creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Product or creator data not found.</p>';
            return;
          }

          if (embedType === 'card') {
            renderProductCard(targetElement, product, creator);
          } else if (embedType === 'checkout-button') {
            if (!stripePriceId) {
              console.error('PayLift Embed: Checkout button embed missing data-stripe-price-id attribute.');
              targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Configuration error: Missing price ID.</p>';
              return;
            }
            renderCheckoutButton(targetElement, product, creator, stripePriceId);
          }
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching product data:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load embed content.</p>';
        });
    } else if (embedType === 'header') {
      // Fetch only creator data for the header
      fetch(`${getBaseUrl()}/api/embed/header/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          if (!creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Creator data not found for header.</p>';
            return;
          }
          renderHeader(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for header:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load embed header.</p>';
        });
    } else if (embedType === 'hero_section') {
      // Fetch creator data for hero section
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          if (!creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Creator data not found for hero section.</p>';
            return;
          }
          renderHeroSection(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for hero section:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load hero section.</p>';
        });
    } else if (embedType === 'product_description') {
      const productId = script.getAttribute('data-product-id');
      if (!productId) {
        targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Product ID required for product description embed.</p>';
        return;
      }

      fetch(`${getBaseUrl()}/api/embed/product/${creatorId}/${productId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const { product, creator } = data;
          if (!product || !creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Product or creator data not found.</p>';
            return;
          }
          renderProductDescription(targetElement, product, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching product data for description:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load product description.</p>';
        });
    } else if (embedType === 'testimonial_section') {
      // Fetch creator data for testimonials
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          if (!creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Creator data not found for testimonials.</p>';
            return;
          }
          renderTestimonialSection(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for testimonials:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load testimonials.</p>';
        });
    } else if (embedType === 'footer') {
      // Fetch creator data for footer
      fetch(`${getBaseUrl()}/api/embed/creator/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const creator = data.creator;
          if (!creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Creator data not found for footer.</p>';
            return;
          }
          renderFooter(targetElement, creator);
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching creator data for footer:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load footer.</p>';
        });
    } else if (embedType === 'pricing_table') {
      // Fetch creator and products data for pricing table
      fetch(`${getBaseUrl()}/api/embed/pricing/${creatorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const { creator, products } = data;
          if (!creator) {
            targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Creator data not found for pricing table.</p>';
            return;
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
              font-family: sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              margin: 16px;
            ">
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
                 ">
                View All Plans
              </a>
            </div>
          `;
        })
        .catch(error => {
          console.error('PayLift Embed: Error fetching pricing data:', error);
          targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load pricing table.</p>';
        });
    } else {
      targetElement.innerHTML = `<p style="color: #ef4444; font-family: sans-serif;">Unknown embed type: ${embedType}</p>`;
    }
  });
})();