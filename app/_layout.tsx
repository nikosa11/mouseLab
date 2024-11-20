import { Stack } from 'expo-router';
import { RacksProvider } from '../contexts/RacksContext';
import { EventsProvider } from '../contexts/EventsContext';

export default function RootLayout() {
  return (
    <EventsProvider>
      <RacksProvider>
        <Stack>
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="rack/[id]"
            options={{
              headerBackTitle: 'Πίσω',
              headerTitle: 'Λεπτομέρειες Rack'
            }}
          />
          <Stack.Screen 
            name="cage/[rackId]/[cageId]"
            options={{
              headerBackTitle: 'Πίσω',
              headerTitle: 'Λεπτομέρειες Κλουβιού'
            }}
          />
        </Stack>
      </RacksProvider>
    </EventsProvider>
  );
}
