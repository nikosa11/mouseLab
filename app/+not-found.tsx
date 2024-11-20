import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, router } from 'expo-router';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.text}>Η σελίδα δεν βρέθηκε</Text>
      
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Επιστροφή</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
