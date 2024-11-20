import React from 'react';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmationModal({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: DeleteConfirmationModalProps) {
  if (!visible) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2 style={styles.modalTitle}>{title}</h2>
        <p style={styles.modalMessage}>{message}</p>
        
        <div style={styles.buttonGroup}>
          <button 
            onClick={onClose} 
            style={styles.cancelButton}
          >
            Ακύρωση
          </button>
          <button 
            onClick={onConfirm}
            style={styles.deleteButton}
          >
            Διαγραφή
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px'
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '16px',
    color: '#DC2626'
  },
  modalMessage: {
    marginBottom: '24px',
    color: '#4B5563'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#D1D5DB'
    }
  },
  deleteButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#DC2626',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#B91C1C'
    }
  }
}; 