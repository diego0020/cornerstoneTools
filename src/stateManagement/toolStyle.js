let defaultWidth = 1,
  activeWidth = 2,
  secondaryWidth = 1;

function setToolWidth (width) {
  defaultWidth = width;
}

function getToolWidth () {
  return defaultWidth;
}

function setActiveWidth (width) {
  activeWidth = width;
}

function getActiveWidth () {
  return activeWidth;
}

function setSecondaryWidth (width) {
  secondaryWidth = width;
}

function getSecondaryWidth () {
  return secondaryWidth;
}

const toolStyle = {
  setToolWidth,
  getToolWidth,
  setActiveWidth,
  getActiveWidth,
  setSecondaryWidth,
  getSecondaryWidth
};

export default toolStyle;
