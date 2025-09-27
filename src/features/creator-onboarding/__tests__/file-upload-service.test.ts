// Mock the Supabase dependencies to avoid import issues during testing
jest.mock('@/libs/supabase/supabase-server-client', () => ({
  createSupabaseServerClient: jest.fn().mockResolvedValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.png' } }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

import { validateFile } from '../services/file-upload-service';

// Mock file creation helper
function createMockFile(name: string, size: number, type: string): File {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
}

describe('File Upload Service', () => {
  describe('validateFile', () => {
    it('should accept valid image files', () => {
      const validFile = createMockFile('logo.png', 1024 * 1024, 'image/png'); // 1MB PNG
      const result = validateFile(validFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept JPEG files', () => {
      const jpegFile = createMockFile('logo.jpg', 2 * 1024 * 1024, 'image/jpeg'); // 2MB JPEG
      const result = validateFile(jpegFile);
      expect(result.valid).toBe(true);
    });

    it('should accept GIF files', () => {
      const gifFile = createMockFile('logo.gif', 500 * 1024, 'image/gif'); // 500KB GIF
      const result = validateFile(gifFile);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP files', () => {
      const webpFile = createMockFile('logo.webp', 1.5 * 1024 * 1024, 'image/webp'); // 1.5MB WebP
      const result = validateFile(webpFile);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeFile = createMockFile('large-logo.png', 10 * 1024 * 1024, 'image/png'); // 10MB PNG
      const result = validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should reject non-image files', () => {
      const textFile = createMockFile('document.txt', 1024, 'text/plain');
      const result = validateFile(textFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should reject PDF files', () => {
      const pdfFile = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
      const result = validateFile(pdfFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type not allowed');
    });

    it('should respect custom file size limits', () => {
      const file = createMockFile('logo.png', 3 * 1024 * 1024, 'image/png'); // 3MB PNG
      
      // Should pass with 5MB limit (default)
      const resultDefault = validateFile(file);
      expect(resultDefault.valid).toBe(true);

      // Should fail with 2MB limit
      const resultCustom = validateFile(file, { maxSize: 2 * 1024 * 1024 });
      expect(resultCustom.valid).toBe(false);
      expect(resultCustom.error).toContain('File size exceeds 2MB limit');
    });

    it('should respect custom allowed file types', () => {
      const pngFile = createMockFile('logo.png', 1024 * 1024, 'image/png');
      const jpegFile = createMockFile('logo.jpg', 1024 * 1024, 'image/jpeg');

      // Only allow PNG files
      const options = { allowedTypes: ['image/png'] };
      
      const pngResult = validateFile(pngFile, options);
      expect(pngResult.valid).toBe(true);

      const jpegResult = validateFile(jpegFile, options);
      expect(jpegResult.valid).toBe(false);
      expect(jpegResult.error).toContain('File type not allowed');
    });

    it('should handle empty file', () => {
      const emptyFile = createMockFile('empty.png', 0, 'image/png');
      const result = validateFile(emptyFile);
      expect(result.valid).toBe(true); // 0 bytes is technically valid
    });

    it('should handle file without extension', () => {
      const noExtFile = createMockFile('logo', 1024 * 1024, 'image/png');
      const result = validateFile(noExtFile);
      expect(result.valid).toBe(true); // Type matters more than filename
    });
  });
});