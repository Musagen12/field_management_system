import React from 'react';

interface ImageWithAuthProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcPath: string;
}

const API_BASE_URL = 'http://localhost:8000';

function resolveUrl(srcPath: string): string {
  if (!srcPath) return '';
  if (/^https?:\/\//i.test(srcPath)) return srcPath;
  const cleanPath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath;
  return `${API_BASE_URL}/${cleanPath}`;
}

export const ImageWithAuth: React.FC<ImageWithAuthProps> = ({ srcPath, alt = '', className, onClick, ...rest }) => {
  const src = resolveUrl(srcPath);
  
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      {...rest}
    />
  );
};

export default ImageWithAuth;
