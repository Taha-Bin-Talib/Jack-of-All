import React from 'react';
import { ScrollView, View } from 'react-native';
import { GameActionButton, GameHeader, GameResultModal, GameSettingsMenu, ScoreRow, colors } from '../design';
import { send } from '../net';
import { GAMES, GameId } from '../games';
import { nameOf } from '../ui';
import Thulla from './Thulla';
import Bluff from './Bluff';
import Jack from './Jack';
import type { RoomState } from '../types';

const ACCENT: Record<string, string> = { thulla: colors.gold, bluff: colors.table.bad, jackthief: colors.text };

/* One frame for every game: header + menu on top, the game's own table in the middle, the result when it ends. */
export default function GameShell({ room, local, onLeave }: { room: RoomState; local: boolean; onLeave: () => void }) {
  const [menu, setMenu] = React.useState(false);
  const g = room.g, me = room.you.id, P = room.players, host = room.hostId === me;
  const meta = GAMES[room.game as GameId];
  const over = room.phase === 'over' && g;
  const rows: ScoreRow[] = [];
  let title = '', lines: string[] = [];
  if (over) {
    const seat = (id: string) => g.seats.find((x: any) => x.id === id);
    if (room.game === 'thulla') {
      title = g.loserId ? (g.loserId === me ? 'You are the Bhabhi!' : `${nameOf(P, g.loserId)} is the Bhabhi!`) : 'Draw';
      lines = g.loserId ? [] : ['Nobody is the Bhabhi.'];
      [...P].sort((a, b) => (seat(a.id)?.place || 99) - (seat(b.id)?.place || 99)).forEach(p => rows.push({ id: p.id, name: p.name, me: p.id === me, tag: p.id === g.loserId ? 'Bhabhi' : seat(p.id)?.place ? `Safe · #${seat(p.id).place}` : 'Safe' }));
    } else if (room.game === 'bluff') {
      title = g.loserId === me ? 'You are left holding the cards!' : g.loserId ? `${nameOf(P, g.loserId)} is left holding the cards!` : 'Game over';
      lines = g.winnerId ? [`${g.winnerId === me ? 'You' : nameOf(P, g.winnerId)} got out first`] : [];
      [...P].sort((a, b) => (seat(a.id)?.place || 99) - (seat(b.id)?.place || 99)).forEach(p => rows.push({ id: p.id, name: p.name, me: p.id === me, tag: p.id === g.loserId ? 'Holding the cards' : seat(p.id)?.place ? `Out · #${seat(p.id).place}` : 'Safe' }));
    } else {
      title = g.thiefId ? (g.thiefId === me ? 'You are the Jack Thief!' : `${nameOf(P, g.thiefId)} is the Jack Thief!`) : 'Draw';
      lines = g.thiefId ? ['Left holding the unmatched Jack.'] : [];
      P.forEach(p => rows.push({ id: p.id, name: p.name, me: p.id === me, tag: p.id === g.thiefId ? 'Jack Thief' : 'Safe' }));
      rows.sort((a, b) => (a.tag === 'Jack Thief' ? 1 : 0) - (b.tag === 'Jack Thief' ? 1 : 0));
    }
  }
  const sub = local ? 'Offline table' : room.game === 'thulla' && g ? `Room ${room.code} · Trick ${g.trickNo}` : `Room ${room.code}`;
  return (
    <View style={{ flex: 1 }}>
      <GameHeader title={meta?.name || room.gameName} subtitle={sub} accent={ACCENT[room.game]} onMenu={() => setMenu(true)} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} overScrollMode="never">
        {room.game === 'thulla' ? <Thulla room={room} /> : room.game === 'bluff' ? <Bluff room={room} /> : <Jack room={room} />}
      </ScrollView>
      <GameResultModal visible={!!over} title={title} lines={lines} rows={rows} accent={ACCENT[room.game]}
        actions={<>
          {host || local ? <GameActionButton title={local ? 'Play again' : 'Back to lobby'} onPress={() => send({ t: 'rematch' })} /> : null}
          <GameActionButton title={local ? 'Back to home' : 'Leave room'} kind="quiet" onPress={onLeave} />
        </>} />
      <GameSettingsMenu visible={menu} onClose={() => setMenu(false)} gameName={meta?.name || room.gameName} rules={meta?.rulesFull || []} code={room.code} local={local} onLeave={onLeave} />
    </View>
  );
}
