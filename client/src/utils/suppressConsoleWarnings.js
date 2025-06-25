// Utility to suppress specific console warnings globally
// This should be imported early in the application startup

const suppressReactQuillWarnings = () => {
  if (typeof window === 'undefined') return;
  
  // Avoid multiple suppressions
  if (window.__CONSOLE_SUPPRESSED__) return;
  
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args[0];
    
    // Suppress ReactQuill specific warnings
    if (typeof message === 'string') {
      if (
        message.includes('findDOMNode is deprecated') ||
        message.includes('DOMNodeInserted') ||
        message.includes('Listener added for a \'DOMNodeInserted\' mutation event') ||
        message.includes('Support for this event type has been removed')
      ) {
        return;
      }
    }
    
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args[0];
    
    if (typeof message === 'string') {
      if (
        message.includes('findDOMNode is deprecated') ||
        message.includes('DOMNodeInserted')
      ) {
        return;
      }
    }
    
    originalWarn.apply(console, args);
  };
  
  window.__CONSOLE_SUPPRESSED__ = true;
};

export default suppressReactQuillWarnings; 