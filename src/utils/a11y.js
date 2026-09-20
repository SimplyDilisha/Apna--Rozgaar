/**
 * Visual Alert System for Deaf/HoH Users
 * Provides visual feedback for events that would normally only have audio alerts
 */
export const announceToScreenReader = (message) => {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = '';
    // Small delay to ensure the change is detected
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
};

export const triggerVisualAlert = (element) => {
  if (element) {
    element.classList.add('visual-alert');
    setTimeout(() => {
      element.classList.remove('visual-alert');
    }, 3000);
  }
};
