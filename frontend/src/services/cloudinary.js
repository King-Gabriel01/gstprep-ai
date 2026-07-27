// Uploads an image file directly from the browser to Cloudinary using an
// unsigned upload preset, so no API secret is ever exposed client-side.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadProfilePicture(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'gstprep-ai/profile-pictures');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Image upload failed: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.secure_url;
}
