import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Rack } from '../../types';

interface AddRackModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (rack: Omit<Rack, 'id'>) => Promise<void>;
}

export default function AddRackModal({ visible, onClose, onAdd }: AddRackModalProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleSubmit = async () => {
    if (!name || !position || !capacity) return;

    await onAdd({
      name,
      position: parseInt(position),
      capacity: parseInt(capacity)
    });

    // Καθαρισμός της φόρμας
    setName('');
    setPosition('');
    setCapacity('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Προσθήκη Νέου Rack</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Όνομα"
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Θέση"
            value={position}
            onChangeText={setPosition}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Χωρητικότητα"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Ακύρωση</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.addButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Προσθήκη</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  addButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
});