/* Game catalogue for the UI. Player counts come straight from the game engine so they can never drift. */
import { RULES } from './rules';

export type GameId = 'thulla' | 'bluff' | 'jackthief';
export type GameMeta = {
  id: GameId; name: string; tagline: string; personality: string[]; blurb: string; accent: string;
  min: number; max: number; players: string; rulesPreview: string[]; rulesFull: string[];
};

const eng = require('./engine/games');
const count = (id: string) => { const g = eng.get(id); return { min: g.min as number, max: g.max as number }; };
const range = (id: string) => { const c = count(id); return `${c.min}–${c.max} players`; };

const COPY: Record<GameId, Pick<GameMeta, 'name' | 'tagline' | 'personality' | 'blurb' | 'accent'>> = {
  thulla: { name: 'Bhabhi Thulla', tagline: 'Survive the table.', personality: ['Competitive', 'Strategic', 'Traditional'], accent: '#BD9857',
    blurb: 'Follow the suit or be thulla’d. Shed every card — the last player still holding cards is the Bhabhi.' },
  bluff: { name: 'Bluff', tagline: 'Trust nobody.', personality: ['Mischievous', 'Deceptive', 'Unpredictable'], accent: '#D9A3A8',
    blurb: 'Play cards face-down, name a rank, and dare the table to call you out. Lie well — or pick up the pile.' },
  jackthief: { name: 'Jack Thief', tagline: 'Don’t get caught.', personality: ['Suspenseful', 'Mysterious', 'Playful'], accent: '#F1E8D5',
    blurb: 'Throw away your pairs, draw blind from your neighbour, and don’t be left holding the lone Jack.' },
};

export const GAME_IDS: GameId[] = ['thulla', 'bluff', 'jackthief'];
export const GAMES: Record<GameId, GameMeta> = Object.fromEntries(GAME_IDS.map(id => [id, {
  id, ...COPY[id], ...count(id), players: range(id),
  rulesPreview: RULES[id].text.slice(0, 3), rulesFull: RULES[id].text,
}])) as Record<GameId, GameMeta>;
