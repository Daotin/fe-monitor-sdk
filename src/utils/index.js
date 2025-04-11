/**
 * Utility functions for the monitoring SDK
 */

/**
 * Check if a value is an object
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is an object
 */
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if a value is a function
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a function
 */
export function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Check if a value is a string
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a string
 */
export function isString(value) {
  return typeof value === 'string';
}

/**
 * Check if a value is a number
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a number
 */
export function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Get browser information
 * @returns {Object} - Browser information
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  const browser = {
    userAgent: ua,
    name: 'unknown',
    version: 'unknown',
  };

  // Extract browser name and version
  const browserRegexes = [
    { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
    { name: 'Safari', regex: /Version\/([0-9.]+).*Safari/ },
    { name: 'Edge', regex: /Edg(e|)\/([0-9.]+)/ },
    { name: 'IE', regex: /Trident.*rv:([0-9.]+)/ },
  ];

  for (const { name, regex } of browserRegexes) {
    const match = ua.match(regex);
    if (match) {
      browser.name = name;
      browser.version = match[1] || match[2] || 'unknown';
      break;
    }
  }

  return browser;
}

/**
 * Get device information
 * @returns {Object} - Device information
 */
export function getDeviceInfo() {
  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    platform: navigator.platform,
    language: navigator.language,
  };
}

/**
 * Generate a unique ID
 * @returns {string} - A unique ID
 */
export function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Throttle a function
 * @param {Function} fn - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/**
 * Debounce a function
 * @param {Function} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Get the current page URL
 * @returns {string} - The current page URL
 */
export function getCurrentPageUrl() {
  return window.location.href;
}

/**
 * Get the current page path
 * @returns {string} - The current page path
 */
export function getCurrentPagePath() {
  return window.location.pathname;
}

/**
 * Get the current timestamp
 * @returns {number} - The current timestamp
 */
export function getTimestamp() {
  return Date.now();
}
