import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopColor: 'rgba(0,0,0,0.06)',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Αρχική',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size-2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="racks"
        options={{
          title: 'Κλουβιά',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size-2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Ημερολόγιο',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size-2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Αναφορές',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size-2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Ρυθμίσεις',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size-2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
