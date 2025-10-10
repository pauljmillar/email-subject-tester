import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageKey = searchParams.get('key');
    
    if (!imageKey) {
      return NextResponse.json({ error: 'Image key is required' }, { status: 400 });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
    }

    // Fetch image from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: imageKey
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Return image with appropriate headers
    const contentType = response.ContentType || 'image/jpeg';
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('S3 proxy error:', error);
    
    // Handle specific S3 errors
    if (error instanceof Error && error.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch image from S3' }, { status: 500 });
  }
}
