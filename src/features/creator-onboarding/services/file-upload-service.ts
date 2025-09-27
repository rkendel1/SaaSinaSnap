import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileUploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

const DEFAULT_OPTIONS: FileUploadOptions = {
  bucket: 'creator-assets',
  folder: 'logos',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * Upload a file to Supabase storage with security validations
 */
export async function uploadFile(
  file: File,
  creatorId: string,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Validate file type
    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`,
      };
    }

    // Validate file size
    if (opts.maxSize && file.size > opts.maxSize) {
      const maxSizeMB = Math.round(opts.maxSize / (1024 * 1024));
      return {
        success: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // Create file path with creator ID for security
    const filePath = `${creatorId}/${opts.folder}/${fileName}`;

    const supabase = await createSupabaseServerClient();

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(opts.bucket!)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(opts.bucket!)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to generate public URL',
      };
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(
  filePath: string,
  bucket: string = 'creator-assets'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase storage delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('File delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: FileUploadOptions = {}
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (opts.maxSize && file.size > opts.maxSize) {
    const maxSizeMB = Math.round(opts.maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check if file is actually an image (additional security)
  if (file.type.startsWith('image/')) {
    // In a browser environment, we could validate the actual image
    // For now, we'll just check the MIME type
    return { valid: true };
  }

  return { valid: true };
}