import { createReadStream } from 'fs';
import path from 'path';
import { stat } from 'fs/promises';
import mime from 'mime-types';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const { boxId, fileName } = event.context.params!;

  const storagePath = path.resolve(config.localStoragePath);
  const boxPath = path.join(storagePath, boxId!);
  const filePath = path.join(boxPath, fileName!);

  // Security check: Ensure the resolved path is still within the storage directory
  if (!path.resolve(filePath).startsWith(storagePath)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }

  try {
    // Check if file exists
    await stat(filePath);

    // Get content type
    const contentType = mime.lookup(fileName!) || 'application/octet-stream';
    setHeader(event, 'Content-Type', contentType);

    // Stream the file
    return sendStream(event, createReadStream(filePath));

  } catch (e: any) {
    if (e.code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found.',
      });
    }
    throw e; // Re-throw other errors
  }
});
