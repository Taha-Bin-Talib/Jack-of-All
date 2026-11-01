import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

/* returns true once every font is ready (or failed — the UI then falls back to system fonts) */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold,
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold,
  });
  return loaded || !!error;
}
