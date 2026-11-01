import React from 'react';
import { Alert, BackHandler, StatusBar, View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { C } from './src/theme';
import { boot, leaveRoom, send, useNet, reconnectNow } from './src/net';
import Home from './src/screens/Home';
import Lobby from './src/screens/Lobby';
import Thulla from './src/screens/Thulla';
import Bluff from './src/screens/Bluff';
import Jack from './src/screens/Jack';
import { Header, Overlay } from './src/screens/Common';
import { nameOf } from './src/ui';
import Chat from './src/Chat';

function GameKeepAwake() { useKeepAwake(); return null; }

function Root() {
  const net = useNet();
  const insets = useSafeAreaInsets();
  const room = net.room;
  React.useEffect(() => { boot(); }, []);
  const confirmLeave = React.useCallback(() => {
    Alert.alert('Leave room?', net.local ? 'This practice game will end.' : room?.phase === 'playing' ? 'The game goes on without you (a bot plays your cards).' : 'You will leave this room.', [
      { text: 'Stay', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: leaveRoom }]);
  }, [room?.phase, net.local]);
  React.useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (room) { confirmLeave(); return true; } return false; });
    return () => h.remove();
  }, [room, confirmLeave]);

  let body: React.ReactNode;
  if (!net.ready) body = null;
  else if (!room) body = <Home />;
  else if (room.phase === 'lobby') body = <Lobby />;
  else {
    const g = room.g, host = room.hostId === room.you.id;
    let over: { title: string; lines: string[] } | null = null;
    if (room.phase === 'over' && g) {
      if (room.game === 'thulla') over = g.loserId ? { title: g.loserId === room.you.id ? 'You are the Bhabhi!' : `${nameOf(room.players, g.loserId)} is the Bhabhi!`, lines: [] } : { title: 'Draw', lines: ['Nobody is the Bhabhi.'] };
      else if (room.game === 'bluff') over = { title: g.loserId === room.you.id ? 'You are left holding the cards!' : g.loserId ? `${nameOf(room.players, g.loserId)} is left holding the cards!` : 'Game over', lines: g.winnerId ? [`${g.winnerId === room.you.id ? 'You' : nameOf(room.players, g.winnerId)} got out first 🎉`] : [] };
      else over = g.thiefId ? { title: g.thiefId === room.you.id ? 'You are the Jack Thief!' : `${nameOf(room.players, g.thiefId)} is the Jack Thief!`, lines: [] } : { title: 'Draw', lines: [] };
    }
    body = (
      <View style={{ flex: 1 }}>
        <GameKeepAwake />
        <Header room={room} local={net.local} onLeave={confirmLeave} />
        {room.game === 'thulla' ? <Thulla room={room} /> : room.game === 'bluff' ? <Bluff room={room} /> : <Jack room={room} />}
        {over && <Overlay title={over.title} lines={over.lines} host={host} local={net.local} onAgain={() => send({ t: 'rematch' })} onLeave={leaveRoom} />}
      </View>
    );
  }
  return (
    <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />
      {room && !net.local && net.conn !== 'online' && <Text style={st.banner} onPress={reconnectNow}>Reconnecting… tap to retry</Text>}
      {body}
      {room && net.ready && !net.local && <Chat />}
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Root /></SafeAreaProvider>;
}
const st = StyleSheet.create({ root: { flex: 1, backgroundColor: C.bg }, banner: { backgroundColor: C.danger, color: '#fff', textAlign: 'center', padding: 6, fontWeight: '700' } });
