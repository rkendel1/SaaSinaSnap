/**
 * Staryer Embed.js - White-labeled page embedding script
 * 
 * Usage:
 * <script src="https://yourapp.com/embed.js"></script>
 * <div data-staryer-embed data-creator="creator-slug" data-mode="inline" data-page="landing"></div>
 */

(function() {
  'use strict';

  // Configuration
  const STARYER_API_BASE = window.location.origin;
  const EMBED_SELECTOR = '[data-staryer-embed]';
  
  // Embed modes
  const EMBED_MODES = {
    IFRAME: 'iframe',
    INLINE: 'inline'
  };

  // CSS for scoped styling
  const SCOPED_CSS = `
    .staryer-embed-container {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    .staryer-embed-container * {
      box-sizing: border-box;
    }
    
    .staryer-embed-iframe {
      width: 100%;
      border: none;
      min-height: 600px;
    }
    
    .staryer-embed-inline {
      width: 100%;
      font-family: inherit;
    }
    
    .staryer-embed-inline img {
      max-width: 100%;
      height: auto;
    }
    
    .staryer-embed-error {
      padding: 20px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      color: #6c757d;
      text-align: center;
    }
    
    .staryer-embed-loading {
      padding: 40px;
      text-align: center;
      color: #6c757d;
    }
  `;

  /**
   * Utility functions
   */
  function addCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
      element.setAttribute(key, attributes[key]);
    });
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }

  function showError(container, message) {
    container.innerHTML = '';
    const errorDiv = createElement('div', { 
      class: 'staryer-embed-error' 
    }, message);
    container.appendChild(errorDiv);
  }

  function showLoading(container) {
    container.innerHTML = '';
    const loadingDiv = createElement('div', { 
      class: 'staryer-embed-loading' 
    }, 'Loading...');
    container.appendChild(loadingDiv);
  }

  /**
   * Fetch embeddable page content
   */
  async function fetchEmbedContent(creatorSlug, pageSlug = 'landing', mode = 'inline') {
    try {
      const url = `${STARYER_API_BASE}/api/embed/${creatorSlug}/${pageSlug}?mode=${mode}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Staryer Embed Error:', error);
      throw error;
    }
  }

  /**
   * Render iframe embed
   */
  function renderIframeEmbed(container, creatorSlug, pageSlug, options = {}) {
    const iframeUrl = `${STARYER_API_BASE}/c/${creatorSlug}?embed=true&page=${pageSlug}`;
    const iframe = createElement('iframe', {
      src: iframeUrl,
      class: 'staryer-embed-iframe',
      frameborder: '0',
      scrolling: 'yes',
      allowtransparency: 'true',
      ...options.iframeAttributes
    });

    // Auto-resize iframe based on content
    iframe.onload = function() {
      try {
        // Post message to get height from iframe content
        iframe.contentWindow.postMessage({ type: 'getHeight' }, '*');
      } catch (e) {
        // Cross-origin restriction, use default height
        iframe.style.height = options.height || '600px';
      }
    };

    container.appendChild(iframe);
  }

  /**
   * Render inline embed
   */
  async function renderInlineEmbed(container, creatorSlug, pageSlug, options = {}) {
    try {
      showLoading(container);
      const content = await fetchEmbedContent(creatorSlug, pageSlug, 'inline');
      
      container.innerHTML = '';
      const inlineDiv = createElement('div', { 
        class: 'staryer-embed-inline',
        'data-creator': creatorSlug
      });
      
      // Apply custom styles if provided
      if (options.customStyles) {
        const style = createElement('style');
        style.textContent = `.staryer-embed-inline[data-creator="${creatorSlug}"] { ${options.customStyles} }`;
        document.head.appendChild(style);
      }
      
      inlineDiv.innerHTML = content.html;
      container.appendChild(inlineDiv);
      
      // Execute any scripts in the content
      const scripts = inlineDiv.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = createElement('script');
        newScript.textContent = script.textContent;
        document.head.appendChild(newScript);
      });
      
    } catch (error) {
      showError(container, 'Failed to load content. Please try again later.');
    }
  }

  /**
   * Initialize embed
   */
  function initializeEmbed(element) {
    const creatorSlug = element.getAttribute('data-creator');
    const mode = element.getAttribute('data-mode') || EMBED_MODES.INLINE;
    const pageSlug = element.getAttribute('data-page') || 'landing';
    
    // Parse additional options
    const options = {};
    const customStyles = element.getAttribute('data-custom-styles');
    const height = element.getAttribute('data-height');
    const width = element.getAttribute('data-width');
    
    if (customStyles) options.customStyles = customStyles;
    if (height) options.height = height;
    if (width) options.width = width;

    // Validate required attributes
    if (!creatorSlug) {
      showError(element, 'Missing required data-creator attribute');
      return;
    }

    // Create container
    element.classList.add('staryer-embed-container');
    
    // Apply width if specified
    if (width) {
      element.style.width = width;
    }

    // Render based on mode
    if (mode === EMBED_MODES.IFRAME) {
      renderIframeEmbed(element, creatorSlug, pageSlug, options);
    } else {
      renderInlineEmbed(element, creatorSlug, pageSlug, options);
    }
  }

  /**
   * Handle iframe resize messages
   */
  function handleIframeMessages(event) {
    if (event.data && event.data.type === 'resize') {
      const iframes = document.querySelectorAll('.staryer-embed-iframe');
      iframes.forEach(iframe => {
        if (iframe.contentWindow === event.source) {
          iframe.style.height = event.data.height + 'px';
        }
      });
    }
  }

  /**
   * Initialize all embeds on the page
   */
  function initializeAllEmbeds() {
    // Add scoped CSS
    addCSS(SCOPED_CSS);
    
    // Find all embed elements
    const embedElements = document.querySelectorAll(EMBED_SELECTOR);
    embedElements.forEach(initializeEmbed);
    
    // Listen for iframe resize messages
    window.addEventListener('message', handleIframeMessages);
  }

  /**
   * Public API
   */
  window.StaryerEmbed = {
    init: initializeAllEmbeds,
    initElement: initializeEmbed,
    version: '1.0.0'
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllEmbeds);
  } else {
    initializeAllEmbeds();
  }

})();