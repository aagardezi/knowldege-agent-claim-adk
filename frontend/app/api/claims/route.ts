import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.WIKI_BUCKET_NAME || 'YOUR_WIKI_BUCKET_NAME';
const storage = new Storage();

export async function GET(req: NextRequest) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Call GCS with delimiter '/' to get top-level folders (prefixes)
    // This avoids listing files inside the subdirectories, making it fast.
    const [files, , apiResponse] = await bucket.getFiles({
      autoPaginate: false,
      delimiter: '/'
    });
    
    const prefixes = apiResponse.prefixes || [];
    
    // Clean up the folder paths, e.g. "CLM-2026-001/" -> "CLM-2026-001"
    // Exclude standard non-claim directories if any exist, like "sources/" or "knowledge/"
    const claims = prefixes
      .map((prefix: string) => prefix.endsWith('/') ? prefix.slice(0, -1) : prefix)
      .filter((claim: string) => {
        // Filter out common system prefixes if they exist
        return claim !== 'sources' && claim !== 'knowledge' && claim !== 'system' && claim.startsWith('CLM');
      });
      
    return NextResponse.json({ claims });
  } catch (error) {
    console.error('Error listing claim folders from GCS:', error);
    return NextResponse.json({ error: 'Failed to load claims' }, { status: 500 });
  }
}
