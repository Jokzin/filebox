import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

export default defineEventHandler(async (event) => {
  const { boxId } = await readBody(event);

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  try {
    // Create a zip from all files tagged with the boxId
    const archiveResult = await cloudinary.uploader.create_zip({
      tags: [boxId],
      public_id: `box-${boxId}-archive`
    });

    // Return the URL of the generated and stored zip file
    return { success: true, zipUrl: archiveResult.secure_url };

  } catch (error) {
    console.error('Error generating Cloudinary zip:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate zip file.',
    });
  }
});
