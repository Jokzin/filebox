import { nanoid } from 'nanoid';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

export default defineEventHandler(async (event) => {
  try {
    const files = await readMultipartFormData(event);

    if (!files || files.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No files uploaded.',
      });
    }

    const boxId = nanoid(10);
    const boxPath = join(process.cwd(), 'public', 'uploads', boxId);

    // Create the directory for the box
    mkdirSync(boxPath, { recursive: true });

    for (const file of files) {
      // Basic sanitization for the filename
      const fileName = basename(file.filename || 'unknown-file');
      const filePath = join(boxPath, fileName);
      
      // Write the file to the disk
      writeFileSync(filePath, file.data);
    }

    console.log(`New box created at ${boxPath}`);

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
