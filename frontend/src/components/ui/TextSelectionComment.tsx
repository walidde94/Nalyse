import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onAddComment: (selectedText: string) => void;
}

export const TextSelectionComment: React.FC<Props> = ({ onAddComment }) => {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Don't trigger if clicking inside our own floating button
      if (containerRef.current?.contains(e.target as Node)) return;

      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelection(null);
          return;
        }

        const text = sel.toString().trim();
        if (text.length === 0) {
          setSelection(null);
          return;
        }

        // Only trigger if selection is within the main analysis area (avoid sidebar/headers)
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Ensure it's a valid rect
        if (rect.width === 0 && rect.height === 0) return;

        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 10, // Position slightly above
        });
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Clear on mouse down unless clicking the button itself
        if (!containerRef.current?.contains(e.target as Node)) {
            setSelection(null);
        }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Clear on scroll
    document.addEventListener('scroll', () => setSelection(null), true);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('scroll', () => setSelection(null), true);
    };
  }, []);

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            left: selection.x,
            top: selection.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999, // Ensure it's on top of everything
          }}
        >
          <button
            onClick={() => {
              onAddComment(selection.text);
              setSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="hover-lift active-press"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <MessageCircle size={14} />
            Comment on Selection
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
