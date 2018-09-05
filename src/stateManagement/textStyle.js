let defaultFontSize = 15,
  defaultFont = `${defaultFontSize}px Arial`,
  defaultBackgroundColor = 'transparent',
  shadowColor = '#000000',
  shadowBlur = 2;

function setFont (font) {
  defaultFont = font;
}

function getFont () {
  return defaultFont;
}

function setFontSize (fontSize) {
  defaultFontSize = fontSize;
}

function getFontSize () {
  return defaultFontSize;
}

function setBackgroundColor (backgroundColor) {
  defaultBackgroundColor = backgroundColor;
}

function getBackgroundColor () {
  return defaultBackgroundColor;
}

function setShadowColor(color) {
  shadowColor = color;
}

function getShadowColor() {
  return shadowColor;
}

function setShadowBlur(value) {
  shadowBlur = value;
}

function getShadowBlur() {
  return shadowBlur;
}


const textStyle = {
  setFont,
  getFont,
  setFontSize,
  getFontSize,
  setBackgroundColor,
  getBackgroundColor,
  setShadowColor: setShadowColor,
  getShadowColor: getShadowColor,
  setShadowBlur: setShadowBlur,
  getShadowBlur: getShadowBlur
};

export default textStyle;
