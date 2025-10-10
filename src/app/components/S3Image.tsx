'use client';

import { useState } from 'react';
import Image from 'next/image';

interface S3ImageProps {
  imageKey: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
}

export default function S3Image({ 
  imageKey, 
  alt, 
  width, 
  height, 
  className = '',
  fallbackSrc = '/images/default-thumbnail.jpeg'
}: S3ImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no image key or error occurred, show fallback
  if (!imageKey || imageError) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover rounded ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Construct S3 proxy URL
  const s3ImageUrl = `/api/s3-proxy?key=${encodeURIComponent(imageKey)}`;

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-[#2A2A2A] rounded flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[#10A37F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={s3ImageUrl}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover rounded ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
