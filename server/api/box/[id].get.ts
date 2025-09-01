import { readdir, stat } from 'fs/promises';
import path from 'path';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const boxId = event.context.params?.id;

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  let files = [];

  try {
    // --- LOCAL STORAGE ---
    const storagePath = path.resolve(config.localStoragePath);
    const boxPath = path.join(storagePath, boxId);

    try {
      const fileNames = await readdir(boxPath);
      for (const fileName of fileNames) {
        const filePath = path.join(boxPath, fileName);
        const stats = await stat(filePath);
        files.push({
          public_id: fileName,
          secure_url: `/api/files/${boxId}/${fileName}`,
          original_filename: fileName,
          format: path.extname(fileName).substring(1),
          bytes: stats.size,
        });
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        // Directory not found, treat as an empty box
        return { success: true, files: [] };
      }
      throw e; // Re-throw other errors
    }

    return { success: true, files };

  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to retrieve box data.' });
  }
});