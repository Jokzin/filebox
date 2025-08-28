import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (ensure these are set in your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default defineEventHandler(async (event) => {
  const boxId = event.context.params?.id;

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  try {
    // Search Cloudinary for resources with the given tag (boxId)
    const imageResult = await cloudinary.api.resources_by_tag(boxId, {
      resource_type: 'image',
      max_results: 500
    });

    const videoResult = await cloudinary.api.resources_by_tag(boxId, {
      resource_type: 'video',
      max_results: 500
    });

    const allResources = [...imageResult.resources, ...videoResult.resources];

    const files = allResources.map(resource => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url
    }));

    if (files.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Box not found or empty.' });
    }

    return { success: true, files };

  } catch (error) {
    console.error('Error fetching box from Cloudinary:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve box data.' });
  }
});
