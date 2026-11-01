import type { GameId } from '../../games';

export type Route =
  | { k: 'home' } | { k: 'games' } | { k: 'game'; id: GameId } | { k: 'create'; id: GameId } | { k: 'join' } | { k: 'profile'; hint?: string }
  | { k: 'settings' } | { k: 'rules' } | { k: 'server' } | { k: 'design' };

export type Nav = { push: (r: Route) => void; pop: () => void; reset: () => void };

/* everything a home sub-screen may need from the shell */
export type Ctx = {
  nav: Nav; name: string; saveProfile: (n: string) => void;
  lastGame: GameId; playOffline: (g: GameId) => void;
  create: (g: GameId) => void; join: (code: string) => void; busy: boolean;
};
