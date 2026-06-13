import SaveSystem from './SaveSystem.js';
import { STREAK_COIN_BASE, STREAK_DAY_CAP } from '../config.js';

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Update the daily play streak. Call once when the main menu opens.
 * Returns { streak, reward, isNew } — isNew is true only on the first
 * visit of a calendar day, with `reward` coins already added to the vault.
 */
export function updateStreak() {
  const now = new Date();
  const today = localDateStr(now);
  const yesterday = localDateStr(new Date(now.getTime() - 86400000));
  const last = SaveSystem.get('lastPlayDate');
  let streak = SaveSystem.get('streak') || 0;

  if (last === today) {
    return { streak, reward: 0, isNew: false };
  }

  streak = last === yesterday ? streak + 1 : 1;
  const reward = STREAK_COIN_BASE * Math.min(streak, STREAK_DAY_CAP);

  SaveSystem.set('streak', streak);
  SaveSystem.set('lastPlayDate', today);
  SaveSystem.incrementStat('coinBank', reward);
  SaveSystem.save();

  return { streak, reward, isNew: true };
}
