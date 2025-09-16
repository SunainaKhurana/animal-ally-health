// Preloader for critical components to improve initial load time
export const preloadCriticalComponents = () => {
  // Preload images that are commonly used
  const commonImages = [
    '/assets/welcome-pets-journey.png',
    '/assets/welcome-pets.png',
    '/assets/empty-pets.png'
  ];

  commonImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Initialize preloading when module is imported
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(preloadCriticalComponents);
  } else {
    setTimeout(preloadCriticalComponents, 100);
  }
}