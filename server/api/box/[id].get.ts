import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { statSync } from 'node:fs';

export default defineEventHandler(async (event) => {
  const boxId = event.context.params?.id;

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  const boxPath = join(process.cwd(), 'public', 'uploads', boxId);

  try {
    // Check if directory exists and is a directory
    const stats = statSync(boxPath);
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }

    const files = await readdir(boxPath);
    return { success: true, files };

  } catch (error) {
    // If the directory doesn't exist or other error occurs
    throw createError({ statusCode: 404, statusMessage: 'Box not found.' });
  }
});
