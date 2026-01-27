export const buildStatusNotice = (error, fallbackMessage = 'Unable to load data right now.') => {
  if (!error) return null;

  const isErrorObject = typeof error === 'object' && error !== null;
  const details = isErrorObject ? error.details : null;
  const isCooldown = Boolean(error?.isCooldown || details?.cooldown);
  const retryAt = error?.retryAt || details?.retryAt;

  let message = typeof error === 'string' ? error : error?.message;
  if (!message) {
    message = fallbackMessage;
  }

  if (isCooldown) {
    const timeLabel = retryAt ? new Date(retryAt).toLocaleTimeString('en-US') : null;
    message = timeLabel
      ? `Data sync paused. New data expected around ${timeLabel}.`
      : 'Data sync paused. New data will appear soon.';
  }

  return {
    message,
    tone: isCooldown ? 'info' : 'error'
  };
};
