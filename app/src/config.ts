// Set EXPO_PUBLIC_SERVER_URL at build time (see eas.json). Must be wss:// for release builds on Android.
export const DEFAULT_SERVER: string = process.env.EXPO_PUBLIC_SERVER_URL || 'wss://jack-of-all-server.onrender.com';
