/* eslint no-bitwise:0 */

export default function (which, mouseButtonMask) {
  // Const mouseButton = (1 << (which - 1));


  // Return ((mouseButtonMask & mouseButton) !== 0);
  return ((which & mouseButtonMask) !== 0);
}
