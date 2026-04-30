import React, { useState } from 'react';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: boolean | string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ label, icon, value, error, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className={`floating-input-container ${isFocused || hasValue ? 'active' : ''}`} style={{
      position: 'relative',
      width: '100%',
      marginTop: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 16px',
        height: '56px',
        borderRadius: '14px',
        background: 'var(--bg-surface)',
        border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : isFocused ? 'rgba(99,102,241,0.5)' : 'var(--border-default)'}`,
        boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.08), 0 8px 20px -8px rgba(239,68,68,0.15)' : isFocused ? '0 0 0 3px rgba(99,102,241,0.08), 0 8px 20px -8px rgba(99,102,241,0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}>
        {icon && (
          <div style={{ 
            color: isFocused ? '#6366f1' : 'var(--text-disabled)', 
            transition: 'color 0.3s',
            marginTop: (isFocused || hasValue) ? '10px' : '0'
          }}>
            {icon}
          </div>
        )}
        <div style={{ position: 'relative', flex: 1, height: '100%' }}>
          <label style={{
            position: 'absolute',
            left: 0,
            top: (isFocused || hasValue) ? '8px' : '50%',
            transform: (isFocused || hasValue) ? 'none' : 'translateY(-50%)',
            fontSize: (isFocused || hasValue) ? '10px' : '14px',
            fontWeight: (isFocused || hasValue) ? 800 : 500,
            color: isFocused ? '#6366f1' : 'var(--text-muted)',
            textTransform: (isFocused || hasValue) ? 'uppercase' : 'none',
            letterSpacing: (isFocused || hasValue) ? '0.1em' : 'normal',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </label>
          <input
            {...props}
            aria-label={label}
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            style={{
              width: '100%',
              height: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              paddingTop: (isFocused || hasValue) ? '20px' : '0',
              transition: 'padding 0.2s',
              ...props.style
            }}
          />
        </div>
      </div>
    </div>
  );
};
