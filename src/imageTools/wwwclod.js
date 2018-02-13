import * as cornerstone from 'cornerstone-core';
import simpleMouseButtonTool from './simpleMouseButtonTool.js';
import touchDragTool from './touchDragTool.js';
import isMouseButtonEnabled from '../util/isMouseButtonEnabled.js';

let toolData = null;
let interactingMode = false;
let lastSession = null;

function mouseUpCallback (e, eventData) {
  if (interactingMode === false) {
    return;
  }

  $(eventData.element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
  $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
  $(eventData.element).off('CornerstoneToolsMouseClick', mouseUpCallback);
  interactionEnd(e, eventData);
  // Reactivate mouseDownCallbacks
  interactingMode = false;
  lastSession = Date.now();
}

function mouseDownCallback (e, eventData) {
  if (isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
    // Disable further mouseDownCallbacks
    const ts = Date.now();

    if (interactingMode === true) {
      // Sanity check, should not happen
      return;
    }

    if (lastSession !== null && (ts - lastSession < 100)) {
      // Rate limit to one session per 1/10 of second
      return;
    }

    interactingMode = true;
    interactionStart(e, eventData);
    $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragCallback);
    $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
    $(eventData.element).on('CornerstoneToolsMouseClick', mouseUpCallback);

    return false; // False = causes jquery to preventDefault() and stopPropagation() this event
  }
}

function touchEndCallback (e, eventData) {
  $(eventData.element).off('CornerstoneToolsTouchDrag', dragCallback);
  $(eventData.element).off('CornerstoneToolsTouchEnd', touchEndCallback);
  $(eventData.element).off('CornerstoneToolsTap', touchEndCallback);
  interactionEnd(e, eventData);
}

function touchStartCallback (e, eventData) {
  interactionStart(e, eventData);
  $(eventData.element).on('CornerstoneToolsTouchDrag', dragCallback);
  $(eventData.element).on('CornerstoneToolsTouchEnd', touchEndCallback);
  $(eventData.element).on('CornerstoneToolsTap', touchEndCallback);

  return false; // False = causes jquery to preventDefault() and stopPropagation() this event
}

function defaultStrategy (eventData) {
  // Here we normalize the ww/wc adjustments so the same number of on screen pixels
  // Adjusts the same percentage of the dynamic range of the image.  This is needed to
  // Provide consistency for the ww/wc tool regardless of the dynamic range (e.g. an 8 bit
  // Image will feel the same as a 16 bit image would)
  const maxVOI = eventData.image.maxPixelValue * eventData.image.slope + eventData.image.intercept;
  const minVOI = eventData.image.minPixelValue * eventData.image.slope + eventData.image.intercept;
  const imageDynamicRange = maxVOI - minVOI;
  const multiplier = imageDynamicRange / 1024;

  const deltaX = eventData.deltaPoints.page.x * multiplier;
  const deltaY = eventData.deltaPoints.page.y * multiplier;

  eventData.viewport.voi.windowWidth += (deltaX);
  eventData.viewport.voi.windowCenter += (deltaY);
}

function mouseDragCallback (e, eventData) {
  wwwclod.strategy(eventData);
  cornerstone.setViewport(eventData.element, eventData.viewport);

  return false; // False = cases jquery to preventDefault() and stopPropagation() this event
}

function dragCallback (e, eventData) {
  e.stopImmediatePropagation(); // Prevent CornerstoneToolsTouchStartActive from killing any press events
  const dragData = eventData;

  const maxVOI = dragData.image.maxPixelValue * dragData.image.slope + dragData.image.intercept;
  const minVOI = dragData.image.minPixelValue * dragData.image.slope + dragData.image.intercept;
  const imageDynamicRange = maxVOI - minVOI;
  const multiplier = imageDynamicRange / 1024;
  const deltaX = dragData.deltaPoints.page.x * multiplier;
  const deltaY = dragData.deltaPoints.page.y * multiplier;

  const config = wwwclod.getConfiguration();

  if (config.orientation) {
    if (config.orientation === 0) {
      dragData.viewport.voi.windowWidth += (deltaX);
      dragData.viewport.voi.windowCenter += (deltaY);
    } else {
      dragData.viewport.voi.windowWidth += (deltaY);
      dragData.viewport.voi.windowCenter += (deltaX);
    }
  } else {
    dragData.viewport.voi.windowWidth += (deltaX);
    dragData.viewport.voi.windowCenter += (deltaY);
  }

  cornerstone.setViewport(dragData.element, dragData.viewport);
}

function interactionStart (e, eventData) {

  const config = wwwclod.getConfiguration();
  let targetWidth = 512;
  let targetHeight = 512;
  let origData;

  if (config) {
    if (config.targetWidth) {
      targetWidth = config.targetWidth;
    }

    if (config.targetHeight) {
      targetHeight = config.targetHeight;
    }
  }

  if ((eventData.image.height < (targetHeight * 1.5)) && (eventData.image.width < (targetWidth * 1.5))) {
    origData = {
      unchanged: true
    };
    toolData = origData;

    return;
  }

  const viewport = eventData.viewport;
  const rotation = viewport.rotation;
  const validRotations = [0, 90, 180, 270];

  if (validRotations.indexOf(rotation) < 0) {
    console.warn('Can\'t handle rotations which are not multiples of 90, falling back to standard mode');
    origData = {
      unchanged: true
    };
    toolData = origData;

    return;
  }

  const image = eventData.image;
  const origViewport = $.extend(true, {}, viewport);

  origData = {
    image,
    viewport: origViewport
  };
  toolData = origData;

  const enabledElement = cornerstone.getEnabledElement(eventData.element);
  const canvas = $(eventData.element).find('canvas').get(0);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const iTransform = cornerstone.internal.getTransform(enabledElement);

  iTransform.invert();
  let bottomRight;
  let topLeft;

  if (rotation === 0) {
    bottomRight = iTransform.transformPoint(canvasWidth, canvasHeight);
    topLeft = iTransform.transformPoint(0, 0);
  }else if (rotation === 270) {
    bottomRight = iTransform.transformPoint(canvasWidth, 0);
    topLeft = iTransform.transformPoint(0, canvasHeight);
  }else if (rotation === 180) {
    bottomRight = iTransform.transformPoint(0, 0);
    topLeft = iTransform.transformPoint(canvasWidth, canvasHeight);
  }else if (rotation === 90) {
    bottomRight = iTransform.transformPoint(0, canvasHeight);
    topLeft = iTransform.transformPoint(canvasWidth, 0);
  }

  bottomRight.x = Math.min(bottomRight.x, image.width);
  bottomRight.y = Math.min(bottomRight.y, image.height);

  topLeft.x = Math.max(0, topLeft.x);
  topLeft.y = Math.max(0, topLeft.y);

  const downImage = downsampleImage(image, targetWidth, targetHeight, topLeft, bottomRight);

  const relativeCenter = {
    x: (topLeft.x + bottomRight.x) / 2 - (image.width / 2),
    y: (topLeft.y + bottomRight.y) / 2 - (image.height / 2)
  };

  let translation2;
  // Translation is applied after rotation

  if (rotation === 0) {
    translation2 = {
      x: (viewport.translation.x + relativeCenter.x) / ((bottomRight.x - topLeft.x) / (targetWidth)),
      y: (viewport.translation.y + relativeCenter.y) / ((bottomRight.y - topLeft.y) / (targetHeight))
    };
  }else if (rotation === 270) {
    translation2 = {
      x: (viewport.translation.x + relativeCenter.y) / ((bottomRight.y - topLeft.y) / (targetHeight)),
      y: (viewport.translation.y - relativeCenter.x) / ((bottomRight.x - topLeft.x) / (targetWidth))
    };
  }else if (rotation === 180) {
    translation2 = {
      x: (viewport.translation.x - relativeCenter.x) / ((bottomRight.x - topLeft.x) / (targetWidth)),
      y: (viewport.translation.y - relativeCenter.y) / ((bottomRight.y - topLeft.y) / (targetHeight))
    };
  }else if (rotation === 90) {
    translation2 = {
      x: (viewport.translation.x - relativeCenter.y) / ((bottomRight.y - topLeft.y) / (targetHeight)),
      y: (viewport.translation.y + relativeCenter.x) / ((bottomRight.x - topLeft.x) / (targetWidth))
    };
  }

  // Viewport.translation = {x: 0, y:0};
  viewport.translation = translation2;
  if (downImage.rowPixelSpacing * targetWidth > downImage.columnPixelSpacing * targetHeight) {
    viewport.scale *= ((bottomRight.x - topLeft.x) / (targetWidth));
  }else {
    viewport.scale *= ((bottomRight.y - topLeft.y) / (targetHeight));
  }

  cornerstone.displayImage(eventData.element, downImage, viewport);
  cornerstone.setViewport(eventData.element, viewport);

  return false; // False = cases jquery to preventDefault() and stopPropagation() this event
}

function interactionEnd (e, eventData) {
  const origData = toolData;

  if ((!origData) || ('unchanged' in origData)) {
    return;
  }

  const modifiedVieport = cornerstone.getViewport(eventData.element);
  const origImage = origData.image;
  const viewport = origData.viewport;

  viewport.voi = modifiedVieport.voi;
  cornerstone.setViewport(eventData.element, viewport);
  cornerstone.displayImage(eventData.element, origImage, viewport);
}

function downsampleImage (image, targetWidth, targetHeight, topLeft, bottomRight) {
  const imageData = image.getPixelData();
  const imgWidth = image.width;
  const offsetY = topLeft.y;
  const offsetX = topLeft.x;
  const strideY = (bottomRight.y - topLeft.y) / targetHeight;
  const strideX = (bottomRight.x - topLeft.x) / targetWidth;
  let i, j, i2, j2, j2c;

  let pixelsArray;

  if (image.color === false) {
    pixelsArray = new imageData.constructor(targetHeight * targetWidth);
    j2c = new Array(targetWidth);
    for (j = 0; j < targetWidth; j++) {
      j2c[j] = Math.ceil(offsetX + (j + 0.5) * strideX);
    }

    for (i = 0; i < targetHeight; i++) {
      i2 = Math.ceil(offsetY + (i + 0.5) * strideY);
      for (j = 0; j < targetWidth; j++) {
        j2 = j2c[j];
        pixelsArray[i * targetWidth + j] = imageData[i2 * imgWidth + j2];
      }
    }
  } else {
    pixelsArray = new imageData.constructor(targetHeight * targetWidth * 4);
    j2c = new Array(targetWidth);
    for (j = 0; j < targetWidth; j++) {
      j2c[j] = Math.ceil(offsetX + (j + 0.5) * strideX);
    }

    for (i = 0; i < targetHeight; i++) {
      i2 = Math.ceil(offsetY + (i + 0.5) * strideY);
      for (j = 0; j < targetWidth; j++) {
        j2 = j2c[j];
        pixelsArray[4 * (i * targetWidth + j) + 0] = imageData[4 * (i2 * imgWidth + j2) + 0];
        pixelsArray[4 * (i * targetWidth + j) + 1] = imageData[4 * (i2 * imgWidth + j2) + 1];
        pixelsArray[4 * (i * targetWidth + j) + 2] = imageData[4 * (i2 * imgWidth + j2) + 2];
        pixelsArray[4 * (i * targetWidth + j) + 3] = imageData[4 * (i2 * imgWidth + j2) + 3];
      }
    }
  }

  function getPixels () {
    return pixelsArray;
  }

  const image2 = {
    imageId: `${image.imageId}_down`,
    minPixelValue: image.minPixelValue,
    maxPixelValue: image.maxPixelValue,
    rows: targetHeight,
    columns: targetWidth,
    height: targetHeight,
    width: targetWidth,
    getPixelData: getPixels,
    color: image.color,
    columnPixelSpacing: (image.columnPixelSpacing ? image.columnPixelSpacing : 1) / strideY,
    rowPixelSpacing: (image.rowPixelSpacing ? image.rowPixelSpacing : 1) / strideX,
    invert: false,
    sizeInBytes: targetWidth * targetHeight * 2 * (image.color ? 1 : 4),
    slope: image.slope,
    intercept: image.intercept,
    windowCenter: image.windowCenter,
    windowWidth: image.windowWidth
  };
  // Don´t use renderWebImage

  if (image2.color === true) {
    image2.render = cornerstone.renderColorImage;
  }else {
    image2.render = cornerstone.renderGrayscaleImage;
  }

  return image2;
}
const wwwclod = simpleMouseButtonTool(mouseDownCallback);

wwwclod.strategies = {
  default: defaultStrategy
};
wwwclod.strategy = defaultStrategy;

const wwwclodTouchDrag = touchDragTool(touchStartCallback);

export {
  wwwclod,
  wwwclodTouchDrag
};
