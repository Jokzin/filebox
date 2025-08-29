import { v2 as cloudinary } from 'cloudinary';

const config = useRuntimeConfig();

// Configure Cloudinary using runtime config
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

export default defineEventHandler(async (event) => {
  const boxId = event.context.params?.id;

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  try {
    // Reverting to the original logic that we know worked for listing.
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
      secure_url: resource.secure_url,
      original_filename: resource.original_filename || resource.filename,
      format: resource.format,
      bytes: resource.bytes,
    }));

    return { success: true, files };

  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve box data.' });
  }
});
