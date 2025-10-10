# S3 Image Storage Setup

This document explains how to configure S3 image storage for the marketing campaigns table.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# S3 Bucket Configuration
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1

# AWS Credentials
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: S3 endpoint for custom S3-compatible services
# S3_ENDPOINT=https://your-s3-endpoint.com
```

## Database Schema Update

Add an `image_url` column to your `marketing_campaigns` table:

```sql
ALTER TABLE marketing_campaigns 
ADD COLUMN image_url VARCHAR(500);
```

## Image Key Format

The `image_url` field should contain the S3 object key (path) to the image file. For example:
- `campaigns/2024/campaign-123/image.jpg`
- `thumbnails/campaign-456/hero.png`
- `assets/company-abc/banner.webp`

## API Endpoints

### S3 Proxy Service
- **Endpoint**: `/api/s3-proxy?key={imageKey}`
- **Method**: GET
- **Description**: Fetches images from S3 and serves them through a proxy
- **Headers**: Includes proper caching and CORS headers

## Components

### S3Image Component
- **Location**: `src/app/components/S3Image.tsx`
- **Purpose**: Handles S3 image loading with fallback support
- **Features**:
  - Loading states with spinner
  - Error handling with fallback images
  - Optimized caching
  - Responsive design

## Usage in CampaignsView

The `CampaignsView` component now uses `S3Image` for both:
1. **Table thumbnails** (64x40px)
2. **Modal images** (300x200px)

## Security Considerations

1. **Private Bucket**: The S3 bucket should be private (not publicly accessible)
2. **Proxy Service**: Images are served through the Next.js API proxy for security
3. **Access Control**: S3 credentials should have minimal required permissions
4. **CORS**: Proper CORS headers are set for cross-origin requests

## Required S3 Permissions

Your AWS credentials need the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Testing

1. Add an `image_url` value to a campaign record
2. Ensure the S3 object exists at that key
3. Verify the image loads in both the table and modal
4. Test fallback behavior when image is missing
