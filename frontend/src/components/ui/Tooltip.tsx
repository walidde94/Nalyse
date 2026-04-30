import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0, left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }
      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isVisible) updateCoords();
  }, [isVisible]);

  return (
    <div 
      className="tooltip-trigger" 
      ref={triggerRef} 
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: 'inline-block' }}
    >
      {children}
      {isVisible && (
        <div 
          className="tooltip-content"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: `translate(${position === 'left' ? '-100%' : position === 'right' ? '0' : '-50%'}, ${position === 'top' ? '-100%' : position === 'bottom' ? '0' : '-50%'})`,
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 100000,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-default)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
            animation: 'tooltip-fade-in 0.2s ease-out'
          }}
        >
          {content}
          <style>{`
            @keyframes tooltip-fade-in {
              from { opacity: 0; transform: translate(${position === 'left' ? '-100%' : position === 'right' ? '0' : '-50%'}, ${position === 'top' ? '-90%' : position === 'bottom' ? '-10%' : '-50%'}); }
              to { opacity: 1; transform: translate(${position === 'left' ? '-100%' : position === 'right' ? '0' : '-50%'}, ${position === 'top' ? '-100%' : position === 'bottom' ? '0' : '-50%'}); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
