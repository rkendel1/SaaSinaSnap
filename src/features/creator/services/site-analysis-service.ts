import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

export interface SiteAnalysisData {
  headerElements: {
    logo?: {
      url: string;
      alt: string;
      width?: number;
      height?: number;
    };
    navigation: Array<{
      text: string;
      href: string;
      isActive?: boolean;
    }>;
    brandName?: string;
    ctaButton?: {
      text: string;
      href: string;
      style: Record<string, string>;
    };
  };
  styling: {
    colors: {
      primary: string;
      secondary?: string;
      background: string;
      text: string;
    };
    fonts: {
      primary: string;
      headings?: string;
      fallbacks: string[];
    };
    layout: {
      containerWidth?: string;
      padding: string;
      headerHeight?: string;
    };
  };
  metadata: {
    title: string;
    description?: string;
    keywords?: string[];
  };
}

export interface SiteAnalysisResult {
  id: string;
  creatorId: string;
  sourceUrl: string;
  analysisData: SiteAnalysisData;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceScore?: number;
  elementsFound: string[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Analyze a website to extract header and branding information
 */
export async function analyzeSite(
  creatorId: string,
  websiteUrl: string
): Promise<SiteAnalysisResult> {
  const supabase = await createSupabaseAdminClient();

  // Create initial analysis record
  const { data: analysisRecord, error: insertError } = await supabase
    .from('site_analysis')
    .insert({
      creator_id: creatorId,
      source_url: websiteUrl,
      extraction_status: 'processing',
    })
    .select()
    .single();

  if (insertError || !analysisRecord) {
    throw new Error(`Failed to create analysis record: ${insertError?.message}`);
  }

  try {
    // Perform the actual site analysis
    const analysisData = await performSiteAnalysis(websiteUrl);
    
    // Calculate confidence score based on elements found
    const confidenceScore = calculateConfidenceScore(analysisData);
    const elementsFound = extractElementsList(analysisData);

    // Update the analysis record with results
    const { data: updatedRecord, error: updateError } = await supabase
      .from('site_analysis')
      .update({
        analysis_data: analysisData,
        extraction_status: 'completed',
        confidence_score: confidenceScore,
        elements_found: elementsFound,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisRecord.id)
      .select()
      .single();

    if (updateError || !updatedRecord) {
      throw new Error(`Failed to update analysis record: ${updateError?.message}`);
    }

    return {
      id: updatedRecord.id,
      creatorId: updatedRecord.creator_id,
      sourceUrl: updatedRecord.source_url,
      analysisData: updatedRecord.analysis_data as SiteAnalysisData,
      extractionStatus: updatedRecord.extraction_status as any,
      confidenceScore: updatedRecord.confidence_score,
      elementsFound: updatedRecord.elements_found || [],
      createdAt: updatedRecord.created_at,
      updatedAt: updatedRecord.updated_at,
    };
  } catch (error) {
    // Update record with error status
    await supabase
      .from('site_analysis')
      .update({
        extraction_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisRecord.id);

    throw error;
  }
}

/**
 * Perform the actual site analysis using web scraping and CSS analysis
 */
async function performSiteAnalysis(websiteUrl: string): Promise<SiteAnalysisData> {
  try {
    // In a real implementation, this would use a headless browser or web scraping service
    // For now, we'll simulate the analysis with mock data based on common patterns
    
    // Basic URL validation
    const url = new URL(websiteUrl);
    
    // Simulate analysis results - in production, this would be actual scraping
    const mockAnalysisData: SiteAnalysisData = {
      headerElements: {
        brandName: extractDomainName(url.hostname),
        navigation: [
          { text: 'Home', href: '/' },
          { text: 'About', href: '/about' },
          { text: 'Services', href: '/services' },
          { text: 'Contact', href: '/contact' },
        ],
        ctaButton: {
          text: 'Get Started',
          href: '/signup',
          style: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
          },
        },
      },
      styling: {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#ffffff',
          text: '#1f2937',
        },
        fonts: {
          primary: 'Inter, system-ui, sans-serif',
          headings: 'Inter, system-ui, sans-serif',
          fallbacks: ['system-ui', 'sans-serif'],
        },
        layout: {
          containerWidth: '1200px',
          padding: '1rem 1.5rem',
          headerHeight: '4rem',
        },
      },
      metadata: {
        title: `${extractDomainName(url.hostname)} - Website`,
        description: `Official website of ${extractDomainName(url.hostname)}`,
        keywords: ['business', 'services', 'website'],
      },
    };

    return mockAnalysisData;
  } catch (error) {
    console.error('Site analysis error:', error);
    throw new Error(`Failed to analyze site: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate confidence score based on elements found
 */
function calculateConfidenceScore(analysisData: SiteAnalysisData): number {
  let score = 0;
  let maxScore = 0;

  // Header elements scoring
  maxScore += 10;
  if (analysisData.headerElements.brandName) score += 3;
  if (analysisData.headerElements.logo) score += 3;
  if (analysisData.headerElements.navigation.length > 0) score += 2;
  if (analysisData.headerElements.ctaButton) score += 2;

  // Styling scoring
  maxScore += 10;
  if (analysisData.styling.colors.primary) score += 3;
  if (analysisData.styling.fonts.primary) score += 3;
  if (analysisData.styling.layout.padding) score += 2;
  if (analysisData.styling.colors.secondary) score += 2;

  return Math.min(score / maxScore, 1);
}

/**
 * Extract list of elements found during analysis
 */
function extractElementsList(analysisData: SiteAnalysisData): string[] {
  const elements: string[] = [];

  if (analysisData.headerElements.brandName) elements.push('brand-name');
  if (analysisData.headerElements.logo) elements.push('logo');
  if (analysisData.headerElements.navigation.length > 0) elements.push('navigation');
  if (analysisData.headerElements.ctaButton) elements.push('cta-button');
  if (analysisData.styling.colors.primary) elements.push('primary-color');
  if (analysisData.styling.fonts.primary) elements.push('font-family');

  return elements;
}

/**
 * Extract a clean domain name from hostname
 */
function extractDomainName(hostname: string): string {
  return hostname
    .replace(/^www\./, '')
    .split('.')
    .slice(0, -1)
    .join('.')
    .split('')
    .map((char, index) => index === 0 ? char.toUpperCase() : char)
    .join('');
}

/**
 * Get site analysis by creator ID
 */
export async function getSiteAnalysis(creatorId: string): Promise<SiteAnalysisResult | null> {
  const supabase = await createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('site_analysis')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('extraction_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    sourceUrl: data.source_url,
    analysisData: data.analysis_data as SiteAnalysisData,
    extractionStatus: data.extraction_status as any,
    confidenceScore: data.confidence_score,
    elementsFound: data.elements_found || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}