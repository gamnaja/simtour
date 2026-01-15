import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ isOpen, x, y, onClose, items }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Boundary check for screen edges
    const menuWidth = 160;
    const menuHeight = items.length * 45 + 16;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
        adjustedX = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
        adjustedY = window.innerHeight - menuHeight - 10;
    }

    return createPortal(
        <div
            ref={menuRef}
            className="glass animate-fade"
            style={{
                position: 'fixed',
                top: adjustedY,
                left: adjustedX,
                zIndex: 9999,
                minWidth: `${menuWidth}px`,
                padding: '8px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.08)'
            }}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                        onClose();
                    }}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: 'none',
                        background: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        color: item.color || 'var(--text)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>,
        document.body
    );
};

export default ContextMenu;
