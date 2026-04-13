export const vibrateCorrect = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export const vibrateWrong = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 40, 40]);
  }
};

export const vibrateMilestone = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    // A nice celebratory pattern
    navigator.vibrate([30, 50, 30, 50, 50]);
  }
};
