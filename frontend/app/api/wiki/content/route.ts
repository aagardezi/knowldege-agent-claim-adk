import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.WIKI_BUCKET_NAME || 'YOUR_WIKI_BUCKET_NAME';
const storage = new Storage();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const claimId = searchParams.get('claimId');
  const filePath = searchParams.get('path') || 'index.md';

  if (!claimId) {
    return NextResponse.json({ error: 'Missing claimId parameter' }, { status: 400 });
  }

  const scopedPath = `${claimId}/${filePath}`;

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(scopedPath);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const [content] = await file.download();
    return NextResponse.json({ content: content.toString('utf-8') });
  } catch (error) {
    console.error(`Error fetching scoped file ${scopedPath}:`, error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}
