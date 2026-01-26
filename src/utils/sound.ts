/**
 * Sound Utility Functions
 * Provides functions to play notification sounds
 */

// Path to the notification sound file in public folder
const NOTIFICATION_SOUND_PATH = '/sounds/new-notification-025-380251.mp3';

/**
 * Play a notification sound
 * Uses the audio file from public/sounds directory
 */
export const playNotificationSound = (): void => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.volume = 1; // Set volume to 70%
    
    // Play the sound
    audio.play().catch((err) => {
      console.error('Error playing notification sound:', err);
      // Some browsers require user interaction before playing audio
      // This is expected behavior and will work after user interaction
    });
  } catch (error) {
    console.error('Error initializing notification sound:', error);
  }
};

/**
 * Play a more prominent notification sound (for important notifications)
 * Plays the notification sound twice with a slight delay
 */
export const playImportantNotificationSound = (): void => {
  try {
    // Play first sound
    playNotificationSound();
    
    // Play second sound after a short delay
    setTimeout(() => {
      playNotificationSound();
    }, 300); // 300ms delay between sounds
  } catch (error) {
    console.error('Error playing important notification sound:', error);
    // Fallback to regular sound
    playNotificationSound();
  }
};
