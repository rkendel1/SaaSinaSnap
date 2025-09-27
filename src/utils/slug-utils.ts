/**
 * Utility functions for generating clean URL slugs from business websites
 */

/**
 * Extract a clean domain name from a URL or website string
 * Handles various edge cases and malformed URLs
 */
export function extractDomainFromUrl(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  let cleanInput = input.trim();
  if (!cleanInput) {
    return null;
  }

  try {
    // First, try to parse as a proper URL
    // If it doesn't start with a protocol, add one for parsing
    let urlToParse = cleanInput;
    if (!/^[a-z0-9]+:\/\//i.test(cleanInput)) {
      urlToParse = `https://${cleanInput}`;
    }

    const url = new URL(urlToParse);
    return url.hostname.toLowerCase();
  } catch (error) {
    // If URL parsing fails, fall back to manual extraction
    return extractDomainManually(cleanInput);
  }
}

/**
 * Manual domain extraction for malformed URLs
 */
function extractDomainManually(input: string): string | null {
  let cleaned = input.toLowerCase().trim();

  // Remove any protocol-like prefix (even malformed ones)
  cleaned = cleaned.replace(/^[a-zA-Z0-9]+:\/\//, '');
  
  // Remove www. prefix
  cleaned = cleaned.replace(/^www\./, '');
  
  // Extract just the domain part (remove paths, query params, etc.)
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];
  cleaned = cleaned.split(':')[0]; // Remove port numbers
  
  // Validate that we have something that looks like a domain
  if (!cleaned || !/^[a-z0-9.-]+$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Generate a clean URL slug from a business website or domain
 * Example: "https://www.vibe-fix.com" -> "vibe-fix"
 * Example: "my-company.org" -> "my-company"
 */
export function generateCleanSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input for slug generation');
  }

  // First extract the domain
  const domain = extractDomainFromUrl(input);
  
  if (!domain) {
    // If we can't extract a domain, treat the input as a direct slug
    return sanitizeSlug(input);
  }

  // Remove www. prefix if present
  let baseName = domain.replace(/^www\./, '');
  
  // Handle common TLD patterns (including country codes)
  const tldPatterns = [
    /\.com$/,
    /\.org$/,
    /\.net$/,
    /\.edu$/,
    /\.gov$/,
    /\.mil$/,
    /\.int$/,
    /\.co\.uk$/,
    /\.co\.in$/,
    /\.co\.jp$/,
    /\.co\.au$/,
    /\.co\.nz$/,
    /\.co\.za$/,
    /\.com\.au$/,
    /\.com\.br$/,
    /\.com\.cn$/,
    /\.com\.mx$/,
    /\.de$/,
    /\.fr$/,
    /\.it$/,
    /\.nl$/,
    /\.be$/,
    /\.ch$/,
    /\.at$/,
    /\.se$/,
    /\.dk$/,
    /\.fi$/,
    /\.no$/,
    /\.pl$/,
    /\.es$/,
    /\.pt$/,
    /\.ie$/,
    /\.uk$/,
    /\.ca$/,
    /\.us$/,
    /\.mx$/,
    /\.br$/,
    /\.ar$/,
    /\.cl$/,
    /\.co$/,
    /\.io$/,
    /\.ai$/,
    /\.app$/,
    /\.dev$/,
    /\.tech$/,
    /\.online$/,
    /\.site$/,
    /\.website$/,
    /\.store$/,
    /\.shop$/,
    /\.blog$/,
    /\.news$/,
    /\.info$/,
    /\.biz$/,
    /\.tv$/,
    /\.me$/,
    /\.ly$/,
  ];

  for (const pattern of tldPatterns) {
    if (pattern.test(baseName)) {
      baseName = baseName.replace(pattern, '');
      break;
    }
  }

  return sanitizeSlug(baseName);
}

/**
 * Sanitize a string to be URL-safe slug
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input for slug sanitization');
  }

  let slug = input.toLowerCase().trim();

  // Replace non-alphanumeric characters (except hyphens) with hyphens
  slug = slug.replace(/[^a-z0-9-]/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Replace multiple hyphens with a single hyphen
  slug = slug.replace(/-+/g, '-');

  if (!slug) {
    throw new Error('Slug cannot be empty after sanitization');
  }

  return slug;
}

/**
 * Validate that a slug is valid for use
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Must be 1-63 characters (DNS hostname limit)
  if (slug.length < 1 || slug.length > 63) {
    return false;
  }

  // Must contain only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Cannot start or end with a hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }

  // Cannot contain consecutive hyphens
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Generate a unique slug by appending a number if needed
 * This function should be used with a database check to ensure uniqueness
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let candidate = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidate;
}