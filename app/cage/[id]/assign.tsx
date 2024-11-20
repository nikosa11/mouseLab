import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from '../../../services/database';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AssignAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [species, setSpecies] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(currentDate);
    }
  };

  const formatDateForWeb = (date: Date) => {
    try {
      return date.toISOString().slice(0, 16);
    } catch (err) {
      console.error('Error formatting date:', err);
      return new Date().toISOString().slice(0, 16);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!species.trim()) {
        throw new Error('Species is required');
      }

      const validBirthDate = new Date(birthDate);
      if (isNaN(validBirthDate.getTime())) {
        throw new Error('Invalid birth date');
      }

      const newAnimal = {
        cage_id: parseInt(id),
        species: species.trim(),
        birth_date: validBirthDate.toISOString(),
        status: 'active',
        notes: notes.trim() || null,
        notification: true
      };

      const animalId = await database.addAnimal(newAnimal);
      
      const eventDate = new Date(validBirthDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      await database.addEvent({
        title: `Check ${species}`,
        date: eventDate,
        notes: `Weekly check for ${species} in Cage ${id}`,
        animalId: animalId,
        recurring: true,
        recurringInterval: 'weekly'
      });

      router.replace({
        pathname: `/cage/${id}`,
        params: { refresh: Date.now().toString() }
      });
    } catch (err) {
      console.error('Error adding animal:', err);
      setError(err instanceof Error ? err.message : 'Failed to add animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Add New Animal</Text>

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
          {Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={formatDateForWeb(birthDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) {
                  setBirthDate(newDate);
                }
              }}
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 8,
              }}
            />
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)} 
                style={styles.dateButton}
              >
                <Text>{birthDate.toLocaleString('el-GR')}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="datetime"
                  display={Platform.OS === 'android' ? "default" : "spinner"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </>
          )}
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
            {loading ? 'Adding...' : 'Add Animal'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#334155',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  dateButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
}); 