import React from 'react';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2147483647
        }} onClick={onCancel}>
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                maxWidth: '90%',
                width: '320px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                animation: 'fadeIn 0.2s ease-out'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: 700 }}>확인</h3>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#dc2626',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
