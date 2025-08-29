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
  const { boxId } = await readBody(event);

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  try {
    // create_zip will bundle all resource types (image, video, etc.) that have the tag.
    const archiveResult = await cloudinary.uploader.create_zip({
      tags: [boxId],
      flatten_folders: true,
    });

    // The result of create_zip includes the public URL of the generated zip file.
    return { success: true, zipUrl: archiveResult.secure_url };

  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate zip file.',
    });
  }
});
