// Thin wrapper around gtag so call sites don't need to guard against it
// being unavailable (blocked by an ad blocker, or not yet loaded).
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
};
