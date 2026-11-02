import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createBucket(bucketName: string) {
  const listResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  
  if (!listResponse.ok) {
    throw new Error('Failed to list buckets');
  }
  
  const buckets = await listResponse.json();
  const bucketExists = buckets.some((b: { name: string }) => b.name === bucketName);
  
  if (!bucketExists) {
    const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: bucketName,
        name: bucketName,
        public: true,
        fileSizeLimit: 10485760
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(error);
    }
    return { success: true, message: `Bucket ${bucketName} created` };
  }
  
  return { success: true, message: `Bucket ${bucketName} already exists` };
}

export async function GET() {
  try {
    const ticketResults = await createBucket("ticket-attachments");
    const reportResults = await createBucket("reports");
    const coverResults = await createBucket("release-covers");
    const trackResults = await createBucket("release-tracks");
    
    return NextResponse.json({ 
      success: true, 
      results: [ticketResults, reportResults, coverResults, trackResults]
    });
  } catch (error: any) {
    console.error("Setup storage error:", error);
    return NextResponse.json({ error: error.message || "Failed to setup storage" }, { status: 500 });
  }
}
