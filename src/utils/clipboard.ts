import Clipboard from '@react-native-clipboard/clipboard';

const AUTO_CLEAR_MS = 20000;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

// Copies sensitive text (passwords) and wipes the clipboard again after a delay so it
// doesn't linger for other apps to read. Each new copy resets the timer for whatever
// was copied most recently.
export function copyWithAutoClear(text: string) {
  Clipboard.setString(text);
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(async () => {
    const current = await Clipboard.getString();
    if (current === text) Clipboard.setString('');
  }, AUTO_CLEAR_MS);
}

export function copyPlain(text: string) {
  Clipboard.setString(text);
}
