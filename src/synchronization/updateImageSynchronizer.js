import external from '../externalModules.js';

/**
 * Redraw target image immediately any time handler is called from source element
 *
 * @param {Object} synchronizer - The Synchronizer instance that attaches this
 * handler to an event
 * @param {HTMLElement} sourceElement - The source element
 * @param {HTMLElement} targetElement - The target element
 */
export default function (synchronizer, sourceElement, targetElement) {

  // Ignore the case where the source and target are the same enabled element
  if (targetElement === sourceElement) {
    return;
  }

  external.cornerstone.updateImage(targetElement);
}
