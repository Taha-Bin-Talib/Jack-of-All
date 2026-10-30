export const RULES: Record<string, { title: string; text: string[] }> = {
  thulla: { title: 'Bhabhi Thulla (3–8 players)', text: [
    'All 52 cards are dealt. The holder of the Ace of Spades starts by playing it. Aces are high.',
    'Each player must follow the suit that was led. If you have none, you play any card — this is a THULLA: the player with the highest card of the led suit picks up every card in that round and leads next.',
    'If everyone follows suit, the round is discarded and the highest card leads next.',
    'First round: nobody can be Thulla’d. If you have no spade, you may play any card lower than 10 (or pass if you have none).',
    'Hand request: on your turn, before playing, you may ask the next player for their hand if they hold fewer than 5 cards (not in the first round or the final duel). They must agree. Once per turn.',
    'You are safe when your hand is empty after a round. The last player holding cards is the Bhabhi.',
    'Final duel: when two players remain, a last card that loses makes you safe. A last card that wins means you blindly pick one of your opponent’s cards and play it. Repeat until someone is left.',
    'You have 1 minute per move, or your highest legal card is played for you.' ] },
  bluff: { title: 'Bluff (3–10 players)', text: [
    'All cards are dealt (two decks with 6+ players by default). The holder of the Ace of Spades goes first.',
    'The required rank goes A, 2, 3 … K, A, … On your turn put 1–4 cards face-down and claim they are all of the required rank. You may lie.',
    'Anyone can call "Bluff!" after you play. Cards are shown: if you lied, you take the whole pile; if you told the truth, the caller takes the pile.',
    'The first player to get rid of all their cards without being caught wins.',
    'You have 1 minute per turn; otherwise cards are played for you.' ] },
  jackthief: { title: 'Jack Thief (2–10 players)', text: [
    'One random Jack is removed and the other cards are dealt. Throw away all pairs of the same rank.',
    'Take turns drawing one face-down card from the next player. If it matches a card in your hand, discard the pair.',
    'The player left holding the unmatched Jack is the Jack Thief — and loses!',
    'You have 1 minute to draw, or a random card is drawn for you.' ] },
};
