import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

/* returns true once every font is ready (or failed — the UI then falls back to system fonts) */
const Redaction10_Bold = require('../../assets/Redaction10-Bold.ttf');

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, Redaction10_Bold,
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold,
  });
  return loaded || !!error;
}
