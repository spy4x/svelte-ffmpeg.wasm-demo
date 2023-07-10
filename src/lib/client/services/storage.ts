export type UploadFileResult =
  | { error: Error; data: null }
  | {
      error: null;
      data: null;
    };

/** Uploads a file to a signed URL */
export async function uploadFile(signedUploadUrl: string, file: File): Promise<UploadFileResult> {
  const response = await fetch(signedUploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    },
  });
  if (!response.ok) {
    return {
      error: new Error(`Error uploading file to ${signedUploadUrl}`),
      data: null,
    };
  }

  console.log({
    name: file.name,
    size: file.size,
    type: file.type,
    url: signedUploadUrl,
    response: await response.text(),
  });

  return {
    error: null,
    data: null,
  };
}
