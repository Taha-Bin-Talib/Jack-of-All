import { useFonts } from 'expo-font';
import { Gelasio_400Regular, Gelasio_500Medium, Gelasio_600SemiBold, Gelasio_700Bold } from '@expo-google-fonts/gelasio';
import { Roboto_700Bold } from '@expo-google-fonts/roboto';

/* returns true once every font is ready (or failed — the UI then falls back to system fonts).
   Gelasio (metric-compatible with Georgia) for the interface; Roboto Bold stays for the playing-card faces. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Gelasio_400Regular, Gelasio_500Medium, Gelasio_600SemiBold, Gelasio_700Bold, Roboto_700Bold });
  return loaded || !!error;
}
