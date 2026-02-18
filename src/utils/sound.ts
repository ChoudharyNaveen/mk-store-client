/**
 * Sound Utility Functions
 * Provides functions to play notification sounds
 */

// Path to the notification sound file in public folder
const NOTIFICATION_SOUND_PATH = '/sounds/new-notification-025-380251.mp3';

/**
 * Play a notification sound
 * Uses the audio file from public/sounds directory
 * Repeats 3 times with 300ms delay between each play
 */
export const playNotificationSound = (): void => {
  const playOnce = (): void => {
    try {
      const audio = new Audio(NOTIFICATION_SOUND_PATH);
      audio.volume = 1;
      audio.play().catch((err) => {
        console.error('Error playing notification sound:', err);
      });
    } catch (error) {
      console.error('Error initializing notification sound:', error);
    }
  };

  const repeatCount = 3;
  const delayMs = 300;
  for (let i = 0; i < repeatCount; i++) {
    setTimeout(() => playOnce(), i * delayMs);
  }
};

/**
 * Play a more prominent notification sound (for important notifications)
 * Plays the notification sound 3 times (same as playNotificationSound)
 */
export const playImportantNotificationSound = (): void => {
  try {
    playNotificationSound();
  } catch (error) {
    console.error('Error playing important notification sound:', error);
    playNotificationSound();
  }
};
