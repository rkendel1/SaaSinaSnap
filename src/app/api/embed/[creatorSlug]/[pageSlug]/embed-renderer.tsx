import { renderToString } from 'react-dom/server';

import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '@/features/creator/types';

interface EmbedRenderProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
  pageSlug: string;
  mode: 'inline' | 'iframe';
}

interface EmbeddableContent {
  html: string;
  css: string;
  metadata: {
    title: string;
    description: string;
    creator: string;
    pageSlug: string;
  };
}

// Inline embeddable page component
function EmbeddableCreatorPage({ creator, products, pageConfig }: {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
}) {
  const brandColor = creator.brand_color || '#3b82f6';
  
  const styles = {
    container: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#fff',
      padding: '0',
      margin: '0'
    },
    header: {
      padding: '1.5rem',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '1rem'
    },
    logo: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: brandColor
    },
    hero: {
      padding: '3rem 1.5rem',
      textAlign: 'center' as const,
      background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)`
    },
    heroTitle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#1f2937'
    },
    heroSubtitle: {
      fontSize: '1.125rem',
      color: '#6b7280',
      marginBottom: '2rem',
      maxWidth: '600px',
      margin: '0 auto 2rem'
    },
    ctaButton: {
      backgroundColor: brandColor,
      color: 'white',
      padding: '0.75rem 2rem',
      fontSize: '1rem',
      fontWeight: '500',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
      transition: 'all 0.2s'
    },
    productsSection: {
      padding: '3rem 1.5rem'
    },
    sectionTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      textAlign: 'center' as const,
      marginBottom: '2rem',
      color: '#1f2937'
    },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginTop: '2rem'
    },
    productCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    productName: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#1f2937'
    },
    productDescription: {
      color: '#6b7280',
      marginBottom: '1rem'
    },
    productPrice: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: brandColor,
      marginBottom: '1rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        {creator.business_logo_url ? (
          <img
            src={creator.business_logo_url}
            alt={creator.business_name || 'Business Logo'}
            style={{ height: '40px', width: 'auto' }}
          />
        ) : (
          <div style={styles.logo}>
            {creator.business_name || 'SaaS Platform'}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          {pageConfig.heroTitle || `Welcome to ${creator.business_name}`}
        </h1>
        <p style={styles.heroSubtitle}>
          {pageConfig.heroSubtitle || creator.business_description}
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${creator.custom_domain || creator.id}`}
          style={styles.ctaButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          {pageConfig.ctaText || 'Get Started'}
        </a>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section style={styles.productsSection}>
          <h2 style={styles.sectionTitle}>Our Products</h2>
          <div style={styles.productGrid}>
            {products.slice(0, 3).map((product) => (
              <div key={product.id} style={styles.productCard}>
                <h3 style={styles.productName}>{product.name}</h3>
                {product.description && (
                  <p style={styles.productDescription}>{product.description}</p>
                )}
                <div style={styles.productPrice}>
                  ${(product.price / 100).toFixed(2)}
                  {product.product_type === 'subscription' && <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/month</span>}
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${creator.custom_domain || creator.id}`}
                  style={{ ...styles.ctaButton, fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Generate scoped CSS for the embedded content
function generateScopedCSS(creatorSlug: string, brandColor: string): string {
  return `
    .staryer-embed-inline[data-creator="${creatorSlug}"] {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fff;
    }
    
    .staryer-embed-inline[data-creator="${creatorSlug}"] * {
      box-sizing: border-box;
    }
    
    .staryer-embed-inline[data-creator="${creatorSlug}"] img {
      max-width: 100%;
      height: auto;
    }
    
    .staryer-embed-inline[data-creator="${creatorSlug}"] a {
      color: ${brandColor};
      text-decoration: none;
    }
    
    .staryer-embed-inline[data-creator="${creatorSlug}"] a:hover {
      opacity: 0.8;
    }
    
    .staryer-embed-inline[data-creator="${creatorSlug}"] button:hover,
    .staryer-embed-inline[data-creator="${creatorSlug}"] a[role="button"]:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    @media (max-width: 768px) {
      .staryer-embed-inline[data-creator="${creatorSlug}"] .hero-title {
        font-size: 2rem !important;
      }
      
      .staryer-embed-inline[data-creator="${creatorSlug}"] .product-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}

export async function renderEmbeddablePage({
  creator,
  products,
  pageConfig,
  pageSlug,
  mode
}: EmbedRenderProps): Promise<EmbeddableContent> {
  try {
    const brandColor = creator.brand_color || '#3b82f6';
    const creatorSlug = creator.custom_domain || creator.id;
    
    // Render the page component to HTML string
    const html = renderToString(
      <EmbeddableCreatorPage
        creator={creator}
        products={products}
        pageConfig={pageConfig}
      />
    );
    
    // Generate scoped CSS
    const css = generateScopedCSS(creatorSlug, brandColor);
    
    // Prepare metadata
    const metadata = {
      title: pageConfig.meta_title || creator.business_name || 'SaaS Platform',
      description: pageConfig.meta_description || creator.business_description || 'Discover our amazing products and services',
      creator: creatorSlug,
      pageSlug
    };
    
    return {
      html,
      css,
      metadata
    };
    
  } catch (error) {
    console.error('Error rendering embeddable page:', error);
    
    // Return error fallback
    return {
      html: '<div style="padding: 20px; text-align: center; color: #666;">Failed to load content</div>',
      css: '',
      metadata: {
        title: 'Error',
        description: 'Failed to load content',
        creator: creator.custom_domain || creator.id,
        pageSlug
      }
    };
  }
}