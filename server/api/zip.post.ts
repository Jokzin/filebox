import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Use HTTPS
});

export default defineEventHandler(async (event) => {
  const { boxId, files } = await readBody(event); // files will be an array of { public_id: '...', secure_url: '...' }

  if (!boxId || !Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' });
  }

  const publicIds = files.map(file => file.public_id);

  try {
    // Generate a zip URL from Cloudinary
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids: publicIds,
      resource_type: 'image', // Assuming images, adjust if other types are present
      // You can add options like 'flatten_folders', 'tags', etc.
    });

    // Return the URL to the frontend
    return { success: true, zipUrl: zipUrl };

  } catch (error) {
    console.error('Error generating Cloudinary zip:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate zip file.',
    });
  }
});
