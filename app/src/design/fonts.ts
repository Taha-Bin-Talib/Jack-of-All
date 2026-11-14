import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Roboto_700Bold } from '@expo-google-fonts/roboto';

/* returns true once every font is ready (or failed — the UI then falls back to system fonts).
   Playfair Display + DM Sans for the interface; Roboto Bold stays for the playing-card faces. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, Roboto_700Bold,
  });
  return loaded || !!error;
}
