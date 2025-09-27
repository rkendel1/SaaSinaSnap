/**
 * Embed Environment Service
 * Handles environment detection and visual indicators for embeds
 */

export type EmbedEnvironment = 'test' | 'production' | 'unknown';

export interface EnvironmentIndicatorConfig {
  show: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style: 'badge' | 'watermark' | 'banner';
  opacity: number;
  size: 'small' | 'medium' | 'large';
}

export interface EnvironmentContext {
  environment: EmbedEnvironment;
  stripeMode: 'test' | 'live';
  creatorId: string;
  productId?: string;
  embedId: string;
  embedType: string;
}

export class EmbedEnvironmentService {
  /**
   * Detect the current environment based on various indicators
   */
  static detectEnvironment(
    stripePublishableKey?: string,
    productData?: any,
    creatorProfile?: any
  ): EmbedEnvironment {
    // Check Stripe key prefix
    if (stripePublishableKey?.startsWith('pk_test_')) {
      return 'test';
    } else if (stripePublishableKey?.startsWith('pk_live_')) {
      return 'production';
    }

    // Check product metadata for environment markers
    if (productData?.metadata?.environment) {
      return productData.metadata.environment as EmbedEnvironment;
    }

    // Check creator profile for current environment setting
    if (creatorProfile?.current_environment) {
      return creatorProfile.current_environment as EmbedEnvironment;
    }

    // Check URL patterns
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname.includes('test') || hostname.includes('staging') || hostname.includes('dev')) {
      return 'test';
    }

    return 'unknown';
  }

  /**
   * Generate environment indicator HTML and CSS
   */
  static generateEnvironmentIndicator(
    context: EnvironmentContext,
    config: EnvironmentIndicatorConfig
  ): { html: string; css: string } {
    if (!config.show || context.environment === 'unknown') {
      return { html: '', css: '' };
    }

    const indicatorId = `env-indicator-${context.embedId}`;
    const isTest = context.environment === 'test';
    
    const baseStyles = this.getBaseIndicatorStyles(config, indicatorId);
    const environmentStyles = this.getEnvironmentSpecificStyles(isTest, config);
    
    const html = this.generateIndicatorHTML(indicatorId, context, config, isTest);
    const css = `${baseStyles}\n${environmentStyles}`;

    return { html, css };
  }

  /**
   * Inject environment indicator into embed
   */
  static injectEnvironmentIndicator(
    embedContainer: HTMLElement,
    context: EnvironmentContext,
    config: EnvironmentIndicatorConfig
  ): void {
    const { html, css } = this.generateEnvironmentIndicator(context, config);
    
    if (!html || !css) return;

    // Inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    // Inject HTML
    const indicatorElement = document.createElement('div');
    indicatorElement.innerHTML = html;
    embedContainer.appendChild(indicatorElement.firstElementChild!);
  }

  /**
   * Get default environment indicator configuration
   */
  static getDefaultIndicatorConfig(environment: EmbedEnvironment): EnvironmentIndicatorConfig {
    return {
      show: environment === 'test', // Only show for test environment by default
      position: 'top-right',
      style: 'badge',
      opacity: 0.8,
      size: 'small',
    };
  }

  /**
   * Update environment context dynamically
   */
  static updateEnvironmentContext(
    embedId: string,
    newContext: Partial<EnvironmentContext>
  ): void {
    const indicator = document.getElementById(`env-indicator-${embedId}`);
    if (!indicator) return;

    // Update indicator based on new context
    if (newContext.environment) {
      const isTest = newContext.environment === 'test';
      indicator.className = indicator.className.replace(
        /(test|production)-indicator/,
        `${newContext.environment}-indicator`
      );
      
      // Update text content
      const textElement = indicator.querySelector('.env-text');
      if (textElement) {
        textElement.textContent = isTest ? 'TEST MODE' : 'LIVE';
      }
    }
  }

  /**
   * Add hover tooltips with environment information
   */
  static addEnvironmentTooltip(
    indicatorElement: HTMLElement,
    context: EnvironmentContext
  ): void {
    const tooltip = document.createElement('div');
    tooltip.className = 'env-tooltip';
    tooltip.innerHTML = `
      <div class="env-tooltip-content">
        <strong>Environment:</strong> ${context.environment.toUpperCase()}<br>
        <strong>Stripe Mode:</strong> ${context.stripeMode.toUpperCase()}<br>
        <strong>Creator ID:</strong> ${context.creatorId}<br>
        ${context.productId ? `<strong>Product ID:</strong> ${context.productId}<br>` : ''}
        <strong>Embed Type:</strong> ${context.embedType}
      </div>
    `;

    indicatorElement.appendChild(tooltip);
    
    // Add hover events
    indicatorElement.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
    });
    
    indicatorElement.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  /**
   * Private helper methods
   */
  private static getBaseIndicatorStyles(
    config: EnvironmentIndicatorConfig,
    indicatorId: string
  ): string {
    const positionStyles = this.getPositionStyles(config.position);
    const sizeStyles = this.getSizeStyles(config.size);
    
    return `
      #${indicatorId} {
        position: absolute;
        ${positionStyles}
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        pointer-events: none;
        user-select: none;
        opacity: ${config.opacity};
        transition: opacity 0.2s ease-in-out;
        ${sizeStyles}
      }
      
      #${indicatorId}:hover {
        opacity: 1;
        pointer-events: auto;
      }
      
      .env-tooltip {
        display: none;
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        margin-bottom: 5px;
      }
      
      .env-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
      }
    `;
  }

  private static getEnvironmentSpecificStyles(
    isTest: boolean,
    config: EnvironmentIndicatorConfig
  ): string {
    const baseColor = isTest ? '#f59e0b' : '#10b981'; // amber for test, emerald for production
    const backgroundColor = isTest ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
    
    if (config.style === 'badge') {
      return `
        .test-indicator,
        .production-indicator {
          background: ${baseColor};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `;
    } else if (config.style === 'watermark') {
      return `
        .test-indicator,
        .production-indicator {
          background: ${backgroundColor};
          border: 1px solid ${baseColor};
          color: ${baseColor};
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
        }
      `;
    } else { // banner
      return `
        .test-indicator,
        .production-indicator {
          background: linear-gradient(90deg, ${baseColor}, ${baseColor}80);
          color: white;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      `;
    }
  }

  private static getPositionStyles(position: EnvironmentIndicatorConfig['position']): string {
    switch (position) {
      case 'top-left':
        return 'top: 8px; left: 8px;';
      case 'top-right':
        return 'top: 8px; right: 8px;';
      case 'bottom-left':
        return 'bottom: 8px; left: 8px;';
      case 'bottom-right':
        return 'bottom: 8px; right: 8px;';
      default:
        return 'top: 8px; right: 8px;';
    }
  }

  private static getSizeStyles(size: EnvironmentIndicatorConfig['size']): string {
    switch (size) {
      case 'small':
        return 'transform: scale(0.85);';
      case 'medium':
        return 'transform: scale(1);';
      case 'large':
        return 'transform: scale(1.15);';
      default:
        return 'transform: scale(0.85);';
    }
  }

  private static generateIndicatorHTML(
    indicatorId: string,
    context: EnvironmentContext,
    config: EnvironmentIndicatorConfig,
    isTest: boolean
  ): string {
    const environmentClass = isTest ? 'test-indicator' : 'production-indicator';
    const environmentText = isTest ? 'TEST MODE' : 'LIVE';
    
    return `
      <div id="${indicatorId}" class="${environmentClass}">
        <span class="env-text">${environmentText}</span>
      </div>
    `;
  }
}