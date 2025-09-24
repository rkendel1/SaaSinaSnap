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
      // Fetch product and creator data from the API using the new URL structure
      fetch(`${getBaseUrl()}/api/embed/product/${creatorId}/${productId}`)
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
    } else {
      targetElement.innerHTML = `<p style="color: #ef4444; font-family: sans-serif;">Unknown embed type: ${embedType}</p>`;
    }
  });
})();