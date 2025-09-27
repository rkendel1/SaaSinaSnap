'use server';

import { revalidatePath } from 'next/cache';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { deleteFile,uploadFile } from '../services/file-upload-service';

export interface FileUploadActionResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Server action to upload a file for a creator
 */
export async function uploadCreatorFileAction(
  formData: FormData,
  folder: string = 'logos'
): Promise<FileUploadActionResult> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Upload the file
    const result = await uploadFile(file, user.id, {
      folder,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (result.success) {
      // Update creator profile with new file URL
      const supabase = await createSupabaseAdminClient();
      await supabase
        .from('creator_profiles')
        .update({
          business_logo_url: result.url,
          business_logo_file_path: result.path,
          uploaded_assets: {
            [folder]: {
              url: result.url,
              path: result.path,
              uploadedAt: new Date().toISOString(),
            },
          },
        })
        .eq('id', user.id);

      // Revalidate relevant paths
      revalidatePath('/creator/onboarding');
      revalidatePath('/creator/dashboard');
    }

    return result;
  } catch (error) {
    console.error('File upload action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Server action to delete a creator's uploaded file
 */
export async function deleteCreatorFileAction(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const supabase = await createSupabaseAdminClient();

    // Verify the file belongs to the current user (security check)
    const { data: profile, error: profileError } = await supabase
      .from('creator_profiles')
      .select('business_logo_file_path, uploaded_assets')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Creator profile not found',
      };
    }

    // Check if the file path belongs to this user
    const userOwnedPath = filePath.startsWith(`${user.id}/`);
    if (!userOwnedPath) {
      return {
        success: false,
        error: 'Unauthorized file access',
      };
    }

    // Delete the file from storage
    const result = await deleteFile(filePath);

    if (result.success) {
      // Update creator profile to remove file references
      const updatedAssets = profile.uploaded_assets || {};
      // Remove the asset from the uploaded_assets object
      Object.keys(updatedAssets).forEach(folder => {
        if (updatedAssets[folder]?.path === filePath) {
          delete updatedAssets[folder];
        }
      });

      await supabase
        .from('creator_profiles')
        .update({
          business_logo_url: profile.business_logo_file_path === filePath ? null : profile.business_logo_url,
          business_logo_file_path: profile.business_logo_file_path === filePath ? null : profile.business_logo_file_path,
          uploaded_assets: updatedAssets,
        })
        .eq('id', user.id);

      // Revalidate relevant paths
      revalidatePath('/creator/onboarding');
      revalidatePath('/creator/dashboard');
    }

    return result;
  } catch (error) {
    console.error('File delete action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}