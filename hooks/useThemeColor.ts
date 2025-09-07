/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof theme.colors
) {
  const scheme = useColorScheme() ?? 'light';
  const override = props[scheme];
  if (override) return override;
  return theme.colors[colorName];
}
