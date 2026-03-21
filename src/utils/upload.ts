import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';

export const uploadToSupabase = async (
  file: File,
  category: string,
  collegeSlug: string
): Promise<string> => {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  let fileToUpload = file;

  // Auto-compress images (NOT PDFs):
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    try {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 0.3,          // max 300 KB per image
        maxWidthOrHeight: 1200,  // max 1200px
        useWebWorker: true,
        fileType: 'image/webp',  // convert to WebP (smallest format)
      });
      console.log(`Compressed: ${(file.size/1024).toFixed(0)}KB → ${(fileToUpload.size/1024).toFixed(0)}KB`);
    } catch (e) {
      console.error('Compression failed, uploading original:', e);
      fileToUpload = file; // fallback to original
    }
  }

  const bucket = `college-${collegeSlug.toLowerCase()}`;
  const ext = isImage ? 'webp' : file.name.split('.').pop();
  const filename = `${category}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket).upload(filename, fileToUpload, { upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket).getPublicUrl(filename);

  return publicUrl;
};
