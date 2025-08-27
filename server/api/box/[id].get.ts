import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default defineEventHandler(async (event) => {
  const boxId = event.context.params?.id;

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  const boxPath = join(process.cwd(), 'public', 'uploads', boxId);
  const boxDataFilePath = join(boxPath, 'box_data.json');

  try {
    const boxData = readFileSync(boxDataFilePath, 'utf-8');
    const files = JSON.parse(boxData);

    return { success: true, files };

  } catch (error) {
    // If the file doesn't exist or other error occurs
    throw createError({ statusCode: 404, statusMessage: 'Box not found or data corrupted.' });
  }
});
