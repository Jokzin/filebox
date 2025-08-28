import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  signature_algorithm: 'sha256'
});

export default defineEventHandler(async (event) => {
  const { boxId } = await readBody(event);

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  try {
    // Create a zip from all files tagged with the boxId
    const archiveResult = await cloudinary.uploader.create_zip({
      tags: [boxId]
    });

    // The public_id from create_zip includes the .zip extension, which must be removed for signing.
    const publicIdForSigning = archiveResult.public_id.replace(/\.zip$/, '');

    // Explicitly create a signed URL for the newly created zip file
    const signedUrl = cloudinary.utils.private_download_url(publicIdForSigning, {
      resource_type: 'raw',
      type: 'upload',
      format: 'zip'
    });

    // Return the signed URL to the frontend
    return { success: true, zipUrl: signedUrl };

  } catch (error) {
    console.error('Error generating Cloudinary zip:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate zip file.',
    });
  }
});
