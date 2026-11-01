import React from 'react';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSnap, playOffline, saveName, savedName, send, useNet } from '../net';
import DesignPreview from '../design/preview/DesignPreview';
import { GAME_IDS, GameId } from '../games';
import HomeMain from './home/HomeMain';
import GamesList from './home/GamesList';
import GameInfo from './home/GameInfo';
import CreateRoom from './home/CreateRoom';
import JoinRoom from './home/JoinRoom';
import Profile from './home/Profile';
import { Rules, Server, Settings } from './home/Settings';
import type { Ctx, Route } from './home/types';

const LAST = 'joa.lastGame';

/* Home shell: a small route stack (Home → Games → Game info, Profile, Settings …) with Android back support.
   Networking and game logic are untouched — create/join/offline all go through ../net. */
export default function Home() {
  const net = useNet();
  const [stack, setStack] = React.useState<Route[]>([{ k: 'home' }]);
  const [name, setName] = React.useState(''), [lastGame, setLast] = React.useState<GameId>('thulla'), [busy, setBusy] = React.useState(false);
  React.useEffect(() => { savedName().then(n => n && setName(n)); AsyncStorage.getItem(LAST).then(g => { if (g && (GAME_IDS as string[]).includes(g)) setLast(g as GameId); }).catch(() => {}); }, []);
  React.useEffect(() => { setBusy(false); }, [net.errSeq, net.room]);

  const pop = React.useCallback(() => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)), []);
  React.useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (stack.length > 1) { pop(); return true; } return false; });
    return () => h.remove();
  }, [stack.length, pop]);

  const remember = (g: GameId) => { setLast(g); AsyncStorage.setItem(LAST, g).catch(() => {}); };
  const c: Ctx = {
    nav: { push: r => setStack(s => [...s, r]), pop, reset: () => setStack([{ k: 'home' }]) },
    name, busy, lastGame,
    saveProfile: n => { setName(n); saveName(n); },
    playOffline: g => { remember(g); playOffline(g, name.trim() || 'You'); },
    create: g => { remember(g); saveName(name.trim()); setBusy(true); send({ t: 'create', game: g, name: name.trim() }); },
    join: code => { saveName(name.trim()); setBusy(true); send({ t: 'join', code, name: name.trim() }); },
  };
  const r = stack[stack.length - 1];
  switch (r.k) {
    case 'games': return <GamesList c={c} />;
    case 'game': return <GameInfo key={r.id} c={c} id={r.id} />;
    case 'create': return <CreateRoom c={c} id={r.id} />;
    case 'join': return <JoinRoom c={c} />;
    case 'profile': return <Profile c={c} hint={r.hint} />;
    case 'settings': return <Settings c={c} />;
    case 'rules': return <Rules c={c} />;
    case 'server': return <Server c={c} />;
    case 'design': return <DesignPreview onBack={pop} />;
    default: return <HomeMain c={c} />;
  }
}
