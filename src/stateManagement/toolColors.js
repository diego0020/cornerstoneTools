
let defaultColor = 'white',
  activeColor = 'greenyellow',
  fillColor = 'transparent',
  secondaryColor = 'grey';

function setFillColor (color) {
  fillColor = color;
}

function getFillColor () {
  return fillColor;
}

function setToolColor (color) {
  defaultColor = color;
}

function getToolColor () {
  return defaultColor;
}

function setActiveColor (color) {
  activeColor = color;
}

function getActiveColor () {
  return activeColor;
}

function getColorIfActive (active) {
  return active ? activeColor : defaultColor;
}

function setSecondaryColor (color) {
  secondaryColor = color;
}

function getSecondaryColor () {
  return secondaryColor;
}

const toolColors = {
  setFillColor,
  getFillColor,
  setToolColor,
  getToolColor,
  setActiveColor,
  getActiveColor,
  getColorIfActive,
  setSecondaryColor,
  getSecondaryColor
};

export default toolColors;
