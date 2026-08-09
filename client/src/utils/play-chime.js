/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// A short two-note synthesized chime (no audio asset needed, so nothing to license). Used
// to celebrate level-ups and badge unlocks; failures (no Web Audio support, autoplay
// policy, etc.) are swallowed since sound is a nice-to-have, not core functionality.
const NOTE_FREQUENCIES = [523.25, 783.99]; // C5, G5
const NOTE_DURATION = 0.18;
const NOTE_GAP = 0.09;

const playChime = () => {
  try {
    if (!window.AudioContext) {
      return;
    }

    const context = new window.AudioContext();
    const { currentTime } = context;

    NOTE_FREQUENCIES.forEach((frequency, index) => {
      const startTime = currentTime + index * NOTE_GAP;

      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + NOTE_DURATION);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + NOTE_DURATION + 0.05);
    });

    setTimeout(
      () => {
        context.close().catch(() => {});
      },
      (NOTE_FREQUENCIES.length * NOTE_GAP + NOTE_DURATION) * 1000 + 100,
    );
  } catch {
    // Sound is non-critical; ignore any Web Audio failure.
  }
};

export default playChime;
