import customCallbackHandler from './../shared/customCallbackHandler.js';
import tap from './tap.js';
import touchStart from './touchStart.js';
import touchStartActive from './touchStartActive.js';

const doubleTap = customCallbackHandler.bind(
  null,
  'doubleTap',
  'doubleTapCallback'
);
// TODO: some touchDrag tools don't want to fire on touchStart
// TODO: Drag tools have an option `fireOnTouchStart` used to filter
// TODO: Them out of TOUCH_START handler
const touchDrag = customCallbackHandler.bind(
  null,
  'touch',
  'touchDragCallback'
);
const touchEnd = customCallbackHandler.bind(null, 'touch', 'touchEndCallback');
const touchPinch = customCallbackHandler.bind(
  null,
  'touchPinch',
  'touchPinchCallback'
);
const touchPress = customCallbackHandler.bind(
  null,
  'touch',
  'touchPressCallback'
);
const multiTouchDrag = customCallbackHandler.bind(
  null,
  'multiTouch',
  'multiTouchDragCallback'
);

export {
  doubleTap,
  multiTouchDrag,
  tap,
  touchDrag,
  touchEnd,
  touchPinch,
  touchPress,
  touchStart,
  touchStartActive
};
