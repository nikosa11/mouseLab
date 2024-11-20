import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

export function ThemedText(props: TextProps) {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: colors.text }, props.style]} />;
}
