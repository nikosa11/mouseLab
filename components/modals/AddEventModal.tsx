import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (eventData: { 
    title: string; 
    description?: string;
    type: string;
    date: string;
  }) => void;
  initialDate: string;
}

export function AddEventModal({ visible, onClose, onAdd, initialDate }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      description: description.trim(),
      type: 'general',
      date: initialDate
    });

    setTitle('');
    setDescription('');
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
          <Text style={styles.modalTitle}>Νέο Event</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Τίτλος"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Περιγραφή (προαιρετικό)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Ακύρωση</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  submitButton: {
    backgroundColor: '#51cf66',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 