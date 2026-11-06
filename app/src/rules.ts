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
    'All cards are dealt (two decks with 6+ players by default). The holder of the Ace of Spades opens the first round.',
    'The opener puts 1–4 cards face-down and names a rank, e.g. “2 Aces”. They may lie.',
    'Then, one player at a time, the next player can: CALL BLUFF on the last play, ADD 1 to 4 more face-down cards to the pile (the claim grows, e.g. “3 Aces”), or PASS.',
    'If you call: the cards just played are shown. Caught lying → the player takes the whole pile. Told the truth → the caller takes the pile. The one who picks up the pile opens the next round.',
    'If everyone passes in a row, the pile is thrown away and the last player to add opens a new round.',
    'If you get rid of all your cards without being caught, you are safe and out of the game. Play goes on until only one player still holds cards — that player loses.',
    'You have 1 minute per turn; if you run out of time you pass (or, when opening, honest cards are played).' ] },
  jackthief: { title: 'Jack Thief (2–10 players)', text: [
    'One random Jack is removed and ALL the other cards are dealt out.',
    'First, everyone throws away their own pairs of the same rank: tap two cards of the same rank and they go to the thrown-away pile, where everyone can see them. Tap Done when you have no pairs left.',
    'Then take turns drawing one face-down card from the next player. You are shown which card you picked and it joins your hand. If it matches a card you hold, tap the two cards to throw the pair away yourself, then tap Done.',
    'The player left holding the unmatched Jack is the Jack Thief — and loses!',
    'You have 1 minute to draw, or a random card is drawn for you.' ] },
};
