import { nanoid } from 'nanoid';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const files = body.files; // Expecting { files: [{ public_id: '...', secure_url: '...' }] }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files data provided.',
      });
    }

    const boxId = nanoid(10);
    const boxPath = join(process.cwd(), 'public', 'uploads', boxId);
    const boxDataFilePath = join(boxPath, 'box_data.json');

    // Create the directory for the box
    mkdirSync(boxPath, { recursive: true });

    // Store Cloudinary file data in a JSON file
    writeFileSync(boxDataFilePath, JSON.stringify(files, null, 2));

    console.log(`New box created with Cloudinary data at ${boxPath}`);

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
