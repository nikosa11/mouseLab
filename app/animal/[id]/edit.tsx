import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../../services/database';
import { Animal } from '../../../types';
const LoadingSpinner = () => (
  <View style={styles.centerContainer}>
    <Text>Loading...</Text>
  </View>
);

export default function EditAnimalScreen() {
  const { id, cageId } = useLocalSearchParams<{ id: string; cageId: string }>();
  const router = useRouter();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [species, setSpecies] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnimal();
  }, [id]);

  const loadAnimal = async () => {
    try {
      if (!id) throw new Error('No animal ID provided');
      
      const animalData = await database.getAnimalById(parseInt(id));
      if (!animalData) throw new Error('Animal not found');

      setAnimal(animalData);
      setSpecies(animalData.species);
      setBirthDate(new Date(animalData.birth_date));
      setNotes(animalData.notes || '');
    } catch (err) {
      console.error('Error loading animal:', err);
      setError(err instanceof Error ? err.message : 'Failed to load animal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!species.trim()) {
        throw new Error('Species is required');
      }

      await database.updateAnimal(parseInt(id), {
        species: species.trim(),
        birth_date: birthDate.toISOString().split('T')[0],
        notes: notes.trim() || null
      });

      router.setParams({ refresh: Date.now().toString() });
      router.back();
    } catch (err) {
      console.error('Error updating animal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update animal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView error={error} />;
  if (!animal) return <ErrorView error="Animal not found" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Edit Animal</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Species</Text>
          <TextInput
            style={styles.input}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g., Mouse C57BL/6"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birth Date</Text>
          <DateTimePicker
            value={birthDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (selectedDate) setBirthDate(selectedDate);
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any relevant notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  form: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});