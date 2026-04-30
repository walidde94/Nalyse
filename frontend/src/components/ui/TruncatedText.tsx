import React, { useRef, useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';

interface TruncatedTextProps {
  text: string;
  className?: string;
  maxWidth?: string | number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ text, className = '', maxWidth = '100%' }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const checkTruncation = () => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  };

  useEffect(() => {
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, maxWidth]);

  const content = (
    <div 
      ref={textRef}
      className={`truncate ${className}`}
      style={{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}
    >
      {text}
    </div>
  );

  if (isTruncated) {
    return <Tooltip content={text}>{content}</Tooltip>;
  }

  return content;
};
