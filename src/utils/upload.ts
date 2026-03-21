export const uploadToSupabase = async (
  file: File,
  category: string,
  collegeSlug: string
): Promise<string> => {
  // Convert file to base64:
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  console.log(`Uploading: ${file.name} (${Math.round(file.size/1024)}KB) via Cloudinary`);

  const res = await fetch(`/api/${collegeSlug}/admin/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN || 'gcfm-admin-token-2026'
    },
    body: JSON.stringify({
      file: base64,
      filename: file.name,
      mimetype: file.type,
      category,
      collegeSlug
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
};

// Keep same function name for backward compatibility
export default uploadToSupabase;
