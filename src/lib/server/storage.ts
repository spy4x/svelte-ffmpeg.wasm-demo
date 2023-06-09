import { MERGE_API_URL } from '$env/static/private';

export type GetSignedUrlForFileUploadResult =
  | { error: Error; data: null }
  | {
      error: null;
      data: {
        url: string;
      };
    };

export async function getSignedUrlForFileUpload(
  path: string,
): Promise<GetSignedUrlForFileUploadResult> {
  const method = 'POST';
  const requestURL = `${MERGE_API_URL}/uploads`;
  const payload = [{ id: 'fake', path }];
  console.log(`${method} ${requestURL}\n${JSON.stringify(payload, null, 4)}`);
  const response = await fetch(requestURL, {
    method,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    console.error(response.status, await response.text());
    return { data: null, error: new Error('Error getting signed URL') };
  }
  const result: { id: string; path: string; url: string }[] = await response.json();
  return {
    error: null,
    data: result[0],
  };
}

export type GetSignedUrlForFileDownloadResult =
  | { error: Error; data: null }
  | {
      error: null;
      data: {
        url: string;
      };
    };

export async function getSignedUrlForFileDownload(
  path: string,
): Promise<GetSignedUrlForFileDownloadResult> {
  // request POST MERGE_API_URL/uploads/get-public-url {path: string} to get {url: string}
  const method = 'POST';
  const requestURL = `${MERGE_API_URL}/uploads/get-public-url`;
  console.log(`${method} ${requestURL}\n${JSON.stringify({ path }, null, 4)}`);
  const response = await fetch(requestURL, {
    method,
    body: JSON.stringify({ path }),
  });
  if (!response.ok) {
    console.error(`Status: `, response.status);
    return { data: null, error: new Error('Error getting signed URL') };
  }
  const result: { url: string } = await response.json();
  console.log(JSON.stringify(result, null, 4));

  return {
    error: null,
    data: result,
  };
}

// export function convertFileURLToProxyURL(url: string): string {
//   return url.replace(
//     PUBLIC_SUPABASE_PROJECT_URL + '/storage/v1/object/sign/media/',
//     APP_URL + '/api/media/',
//   );
// }

export type GetFileURLByPathResult =
  | { fileId: string; path: string; url: null; error: Error }
  | { fileId: string; path: string; url: string; error: null };

export async function getFileUrlByPath(
  path: string,
  fileId: string,
): Promise<GetFileURLByPathResult> {
  const { error, data } = await getSignedUrlForFileDownload(path);
  if (error) {
    console.error({ fileId, path, error });
    return { fileId, path, url: null, error };
  }
  // const url = convertFileURLToProxyURL(data.url);
  return { fileId, path, url: data.url, error: null };
}

const x = [
  {
    id: 'uh7gfhx',
    url: null,
    path: null,
    actor: null,
    mimeType: null,
    description: '',
    durationSec: 0,
  },
];
