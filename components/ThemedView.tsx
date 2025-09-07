import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Use existing background token
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'bg0');
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
