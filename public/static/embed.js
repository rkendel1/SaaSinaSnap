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

  // Find all script tags that have the data-product-id attribute
  const scripts = document.querySelectorAll('script[data-product-id]');

  scripts.forEach(script => {
    const productId = script.getAttribute('data-product-id');
    const creatorId = script.getAttribute('data-creator-id'); // Not directly used in rendering, but good to have

    if (!productId) {
      console.error('PayLift Embed: Script tag missing data-product-id attribute.');
      return;
    }

    const targetElement = document.getElementById(`paylift-product-card-${productId}`);
    if (!targetElement) {
      console.error(`PayLift Embed: Target div with id 'paylift-product-card-${productId}' not found.`);
      return;
    }

    // Fetch product data from the API
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

        const brandColor = creator.brand_color || '#3b82f6';
        const gradientCss = generateGradientCss(brandColor);
        const pricingPageUrl = `${getBaseUrl()}/c/${creator.custom_domain || creator.id}/pricing`;

        // Features (hardcoded for simplicity in embed, could be dynamic from product metadata)
        const features = [
          'Full access to all features',
          '24/7 customer support',
          'Cancel anytime',
        ];

        // Construct the HTML for the product card with inline styles
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
      })
      .catch(error => {
        console.error('PayLift Embed: Error fetching product data:', error);
        targetElement.innerHTML = '<p style="color: #ef4444; font-family: sans-serif;">Failed to load product card.</p>';
      });
  });
})();