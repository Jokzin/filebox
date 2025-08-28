import { nanoid } from 'nanoid';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const boxId = body.boxId; // Get boxId from frontend
    const files = body.files; // Expecting { files: [{ public_id: '...', secure_url: '...' }] }

    if (!boxId || !files || !Array.isArray(files) || files.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: boxId or files data missing.',
      });
    }

    // No local file system operations needed anymore, as files are tagged in Cloudinary

    console.log(`Box ID ${boxId} created and files tagged in Cloudinary.`);

    return {
      success: true,
      boxId: boxId
    };
  } catch (error) {
    console.error('Error creating box:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create the box.',
    });
  }
});
