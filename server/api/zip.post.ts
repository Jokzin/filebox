import path from 'path';
import archiver from 'archiver';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const { boxId } = await readBody(event);

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  // --- LOCAL ZIP LOGIC ---
  const storagePath = path.resolve(config.localStoragePath);
  const boxPath = path.join(storagePath, boxId);

  setHeader(event, 'Content-Type', 'application/zip');
  setHeader(event, 'Content-Disposition', `attachment; filename="${boxId}.zip"`);

  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.on('warning', (err) => {
    if (err.code !== 'ENOENT') throw err;
  });
  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive data to the response
  archive.pipe(event.node.res);
  // Append files from the box directory
  archive.directory(boxPath, false);
  // Finalize the archive
  await archive.finalize();

  return event.node.res.end();
});