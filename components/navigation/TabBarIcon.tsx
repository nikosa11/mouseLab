import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <Ionicons size={24} name={name} color={color} />;
}
