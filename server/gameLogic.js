// WPM = (characters typed / 5) / minutes elapsed
// We use characters/5 as the standard "word" unit
function calculateWPM(correctChars, startTimeMs) {
  const now = Date.now();
  const minutesElapsed = (now - startTimeMs) / 60000;
  if (minutesElapsed <= 0) return 0;
  const words = correctChars / 5; // only correct chars
  return Math.round(words / minutesElapsed);
}

// Progress as a percentage of passage completed
function calculateProgress(typedLength, passageLength) {
  if (passageLength === 0) return 0;
  return Math.min(100, Math.round((typedLength / passageLength) * 100));
}

// Accuracy = correct chars / total chars attempted
function calculateAccuracy(correctChars, totalChars) {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
}

// Check if all players have finished
function allPlayersFinished(players) {
  const playerList = Object.values(players);
  if (playerList.length === 0) return false;
  return playerList.every((p) => p.finished);
}

module.exports = {
  calculateWPM,
  calculateProgress,
  calculateAccuracy,
  allPlayersFinished,
};
