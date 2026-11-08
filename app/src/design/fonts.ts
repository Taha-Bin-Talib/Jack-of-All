import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { Gelasio_700Bold } from '@expo-google-fonts/gelasio';

/* returns true once every font is ready (or failed — the UI then falls back to system fonts) */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold, Gelasio_700Bold });
  return loaded || !!error;
}
