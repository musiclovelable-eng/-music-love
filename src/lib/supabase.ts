const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function uploadToSupabaseStorage(
  file: Buffer,
  fileName: string,
  contentType: string,
  bucketName: string = 'ticket-attachments'
): Promise<string> {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucketName}/${fileName}`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: file
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload to Supabase: ${error}`);
  }
  
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;
}

export function getPublicUrl(bucketName: string, filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
}
