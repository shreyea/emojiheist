const fs = require('fs');
const path = require('path');
const files = [
  'app/page.js', 'app/layout.js', 'app/game/page.js', 'app/rooms/page.js',
  'app/room/[roomId]/page.js', 'components/VotingScreen.js', 'components/Timer.js',
  'components/SentenceBlanks.js', 'components/Scoreboard.js', 'components/PlayerStats.js',
  'components/Lobby.js', 'components/GuessChat.js', 'components/FloatingEmojiBackground.js',
  'components/EmojiPlanner.js', 'components/EmojiDisplay.js', 'components/Confetti.js',
  'lib/useRoom.js', 'lib/supabase.js', 'lib/sounds.js', 'lib/similarityCheck.js',
  'lib/roomRegistry.js', 'lib/roomCode.js', 'lib/playerStats.js', 'lib/missions.js',
  'lib/generateBlanks.js'
];
const base = 'd:\\projects\\emoji heist';
files.forEach(f => {
  const old = path.join(base, ...f.split('/'));
  const nw = old.replace(/\.js$/, '.jsx');
  try { fs.renameSync(old, nw); console.log('OK: ' + f); }
  catch(e) { console.log('FAIL: ' + f + ' - ' + e.message); }
});
