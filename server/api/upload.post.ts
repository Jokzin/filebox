import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const multipartFormData = await readMultipartFormData(event);

  const boxIdData = multipartFormData?.find(el => el.name === 'boxId');
  const boxId = boxIdData?.data.toString();

  if (!boxId) {
    throw createError({ statusCode: 400, statusMessage: 'Box ID is required.' });
  }

  const fileFields = multipartFormData?.filter(el => el.name === 'files' && el.filename);

  if (!fileFields || fileFields.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files were uploaded.' });
  }

  const uploadedFiles = [];

  // --- LOCAL STORAGE LOGIC ---
  const storagePath = path.resolve(config.localStoragePath);
  const boxPath = path.join(storagePath, boxId);
  await mkdir(boxPath, { recursive: true });

  for (const file of fileFields) {
    const filePath = path.join(boxPath, file.filename!);
    await writeFile(filePath, file.data);
    uploadedFiles.push({
      secure_url: `/api/files/${boxId}/${file.filename}`,
      public_id: file.filename!,
      original_filename: file.filename!,
      bytes: file.data.length,
      format: path.extname(file.filename!).substring(1),
    });
  }

  return { success: true, files: uploadedFiles, boxId };
});