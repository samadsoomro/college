import imageCompression from 'browser-image-compression';

export const uploadToSupabase = async (
  file: File,
  category: string,
  collegeSlug: string
): Promise<string> => {
  let fileToUpload: File = file;

  // Compress images only (not PDFs):
  const isImage = file.type.startsWith('image/');
  if (isImage) {
    try {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
      });
      console.log(`Compressed: ${Math.round(file.size/1024)}KB → ${Math.round(fileToUpload.size/1024)}KB`);
    } catch {
      fileToUpload = file; // fallback to original
    }
  }

  // Upload via backend API (uses service role key — bypasses RLS issues):
  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('category', category);
  formData.append('collegeSlug', collegeSlug);

  const res = await fetch(`/api/${collegeSlug}/admin/upload`, {
    method: 'POST',
    headers: {
      'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026'
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
};
