import React from 'react';
import { Alert, BackHandler, Image, StatusBar, View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { colors } from './src/design';
import { boot, leaveRoom, useNet, reconnectNow } from './src/net';
import Home from './src/screens/Home';
import Lobby from './src/screens/Lobby';
import GameShell from './src/screens/GameShell';
import Chat from './src/Chat';
import { Appear, useAppFonts } from './src/design';

function GameKeepAwake() { useKeepAwake(); return null; }

function Root() {
  const net = useNet();
  const insets = useSafeAreaInsets();
  const fontsReady = useAppFonts();
  const room = net.room;
  const [held, setHeld] = React.useState(true);                      // the splash stays up for at least one second
  React.useEffect(() => { boot(); const t = setTimeout(() => setHeld(false), 1000); return () => clearTimeout(t); }, []);
  const confirmLeave = React.useCallback(() => {
    Alert.alert('Leave room?', net.local ? 'This practice game will end.' : room?.phase === 'playing' ? 'The game goes on without you (your cards are played for you).' : 'You will leave this room.', [
      { text: 'Stay', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: leaveRoom }]);
  }, [room?.phase, net.local]);
  React.useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (room) { confirmLeave(); return true; } return false; });
    return () => h.remove();
  }, [room, confirmLeave]);

  if (held || !net.ready || !fontsReady) {
    return (
      <View style={[st.root, { alignItems: 'center', justifyContent: 'center' }]} accessibilityLabel="Jack of All">
        <StatusBar barStyle="light-content" />
        <Image source={require('./assets/splash-icon.png')} style={{ width: 240, height: 240 }} resizeMode="contain" />
      </View>
    );
  }
  let body: React.ReactNode;
  if (!room) body = <Home />;
  else if (room.phase === 'lobby') body = <Lobby />;
  else {
    body = (
      <View style={{ flex: 1 }}>
        <GameKeepAwake />
        <GameShell room={room} local={net.local} onLeave={confirmLeave} />
      </View>
    );
  }
  return (
    <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      {room && !net.local && net.conn !== 'online' && <Text style={st.banner} onPress={reconnectNow}>Reconnecting… tap to retry</Text>}
      <Appear key={room ? 'lobby' : 'home'} duration={240} style={{ flex: 1 }}>{body}</Appear>
      {room && net.ready && !net.local && <Chat />}
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Root /></SafeAreaProvider>;
}
const st = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg }, banner: { backgroundColor: '#C94141', color: '#FFFFFF', textAlign: 'center', padding: 8, fontFamily: 'DMSans_600SemiBold', fontSize: 14 } });
