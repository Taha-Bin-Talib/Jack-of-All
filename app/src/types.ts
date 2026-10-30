export type Setting = { key: string; label: string; options: { value: string; label: string }[] };
export type GameInfo = { id: string; name: string; min: number; max: number; settings: Setting[] };
export type Player = { id: string; name: string; connected: boolean };
export type Seat = { id: string; count: number; out?: boolean; place?: number };
export type RoomState = {
  code: string; game: string; gameName: string; hostId: string; settings: Record<string, string>;
  phase: 'lobby' | 'playing' | 'over'; players: Player[]; you: { id: string }; g: any;
};
