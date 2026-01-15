import { useState, useCallback, useRef } from 'react';

export const useContextMenu = () => {
    const [contextMenu, setContextMenu] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        data: null
    });
    const timerRef = useRef(null);

    const onContextMenu = useCallback((e, data) => {
        e.preventDefault();
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            data
        });
    }, []);

    const onTouchStart = useCallback((e, data) => {
        const touch = e.touches[0];
        const { clientX: x, clientY: y } = touch;

        timerRef.current = setTimeout(() => {
            setContextMenu({
                isOpen: true,
                x,
                y,
                data
            });
            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 600); // 600ms for long press
    }, []);

    const onTouchEnd = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        contextMenu,
        onContextMenu,
        onTouchStart,
        onTouchEnd,
        closeContextMenu
    };
};
