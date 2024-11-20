import React from 'react';

interface CageActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEmpty: () => void;
  onViewDetails?: () => void;
  cageNumber: number;
}

export default function CageActionsModal({
  visible,
  onClose,
  onEmpty,
  onViewDetails,
  cageNumber
}: CageActionsModalProps) {
  if (!visible) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2 style={styles.modalTitle}>Cage {cageNumber}</h2>
        
        <div style={styles.buttonGroup}>
          {onViewDetails && (
            <button 
              onClick={onViewDetails}
              style={styles.actionButton}
            >
              Προβολή Λεπτομερειών
            </button>
          )}
          
          <button 
            onClick={onEmpty}
            style={styles.emptyButton}
          >
            Άδειασμα Κλουβιού
          </button>
          
          <button 
            onClick={onClose}
            style={styles.cancelButton}
          >
            Ακύρωση
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
    marginBottom: '24px',
    textAlign: 'center' as const
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  actionButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3B82F6',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  },
  emptyButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#EF4444',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#E5E7EB',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s'
  }
}; 