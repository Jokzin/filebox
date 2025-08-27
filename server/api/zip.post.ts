import archiver from 'archiver';
import { join, resolve } from 'node:path';
import { statSync } from 'node:fs';

export default defineEventHandler(async (event) => {
  const { boxId, files } = await readBody(event);

  if (!boxId || !Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' });
  }

  // Set headers for zip download
  event.node.res.setHeader('Content-Type', 'application/zip');
  event.node.res.setHeader('Content-Disposition', `attachment; filename="${boxId}-archive.zip"`);

  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // Pipe archive data to the response
  archive.pipe(event.node.res);

  const uploadsDir = resolve(process.cwd(), 'public', 'uploads');
  const boxDir = resolve(uploadsDir, boxId);

  for (const filename of files) {
    const filePath = resolve(boxDir, filename);

    // Security check: ensure file is within the box directory
    if (!filePath.startsWith(boxDir)) {
      console.warn(`Skipping file outside of box directory: ${filename}`);
      continue;
    }

    try {
      // Check if file exists before adding
      if (statSync(filePath).isFile()) {
        archive.file(filePath, { name: filename });
      }
    } catch (e) {
      console.warn(`File not found or is not a file, skipping: ${filename}`);
    }
  }

  await archive.finalize();
});
