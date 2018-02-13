import * as cornerstone from 'cornerstone-core';
import touchDragTool from './touchDragTool.js';
import { getBrowserInfo } from '../util/getMaxSimultaneousRequests.js';
import isMouseButtonEnabled from '../util/isMouseButtonEnabled.js';

let configuration = {
  magnifySize: 300,
  magnificationLevel: 5
};

let browserName;
let currentPoints;
let zoomCanvas = null;

/** Remove the magnifying glass when the mouse event ends */
function mouseUpCallback (e, eventData) {
  $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
  $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
  $(eventData.element).off('CornerstoneToolsMouseClick', mouseUpCallback);
  hideTool(eventData);
}

function hideTool (eventData) {
  $(eventData.element).find('.magnifyTool').hide();
  // Re-enable the mouse cursor
  document.body.style.cursor = 'default';
  zoomCanvas = null;
}

/** Draw the magnifying glass on mouseDown, and begin tracking mouse movements */
function mouseDownCallback (e, eventData) {

  const element = eventData.element;

  if (isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
    $(element).on('CornerstoneToolsMouseDrag', eventData, dragCallback);
    $(element).on('CornerstoneToolsMouseUp', eventData, mouseUpCallback);
    $(element).on('CornerstoneToolsMouseClick', eventData, mouseUpCallback);

    currentPoints = eventData.currentPoints;
    $(element).on('CornerstoneNewImage', eventData, newImageCallback);
    $(element).on('CornerstonePreRender', eventData, drawZoomedCanvas);

    return false; // False = causes jquery to preventDefault() and stopPropagation() this event
  }
}

function newImageCallback (e, eventData) {
  eventData.currentPoints = currentPoints;
  drawMagnificationTool(eventData);
}

function dragEndCallback (e, eventData) {
  const element = eventData.element;

  $(eventData.element).off('CornerstoneToolsDragEnd', dragEndCallback);
  $(eventData.element).off('CornerstoneToolsTouchEnd', dragEndCallback);
  $(element).off('CornerstoneNewImage', newImageCallback);
  hideTool(eventData);
}

/** Drag callback is triggered by both the touch and mouse magnify tools */
function dragCallback (e, eventData) {
  currentPoints = eventData.currentPoints;

  drawMagnificationTool(eventData);
  if (eventData.isTouchEvent === true) {
    $(eventData.element).on('CornerstoneToolsDragEnd', dragEndCallback);
    $(eventData.element).on('CornerstoneToolsTouchEnd', dragEndCallback);
  }

  return false; // False = causes jquery to preventDefault() and stopPropagation() this event
}

function drawMagnificationTool (eventData) {
  const magnify = $(eventData.element).find('.magnifyTool').get(0);

  if (!magnify) {
    createMagnificationCanvas(eventData.element);
  }

  const config = magnify2.getConfiguration();

  const magnifySize = config.magnifySize;
  const magnificationLevel = config.magnificationLevel;

  if (zoomCanvas === null) {
    // Ignore until next event
    return;
  }

  // The 'not' magnifyTool class here is necessary because cornerstone places
  // No classes of it's own on the canvas we want to select
  const canvas = $(eventData.element).find('canvas').not('.magnifyTool').get(0);
  const context = canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  const zoomCtx = magnify.getContext('2d');

  zoomCtx.setTransform(1, 0, 0, 1, 0, 0);

  const getSize = magnifySize;

  // Calculate the on-canvas location of the mouse pointer / touch
  const canvasLocation = cornerstone.pixelToCanvas(eventData.element, eventData.currentPoints.image);

  if (eventData.isTouchEvent === true) {
    canvasLocation.y -= 1.25 * getSize;
  }

  canvasLocation.x = Math.max(canvasLocation.x, 0);
  canvasLocation.x = Math.min(canvasLocation.x, canvas.width);

  canvasLocation.y = Math.max(canvasLocation.y, 0);
  canvasLocation.y = Math.min(canvasLocation.y, canvas.height);

  // Clear the rectangle
  zoomCtx.clearRect(0, 0, magnifySize, magnifySize);
  zoomCtx.fillStyle = 'transparent';
  // ZoomCtx.fillStyle = 'green';

  // Fill it with the pixels that the mouse is clicking on
  zoomCtx.fillRect(0, 0, magnifySize, magnifySize);

  const copyFrom = {
    x: canvasLocation.x * magnificationLevel - 0.5 * getSize,
    y: canvasLocation.y * magnificationLevel - 0.5 * getSize
  };

  if (browserName === 'Safari') {
    // Safari breaks when trying to copy pixels with negative indices
    // This prevents proper Magnify usage
    copyFrom.x = Math.max(copyFrom.x, 0);
    copyFrom.y = Math.max(copyFrom.y, 0);
  }

  copyFrom.x = Math.min(copyFrom.x, zoomCanvas.width);
  copyFrom.y = Math.min(copyFrom.y, zoomCanvas.height);

  // ZoomCtx.drawImage(canvas, copyFrom.x, copyFrom.y, canvas.width - copyFrom.x, canvas.height - copyFrom.y, 0, 0, scaledMagnify.x, scaledMagnify.y);
  zoomCtx.drawImage(zoomCanvas, copyFrom.x, copyFrom.y, getSize, getSize, 0, 0, getSize, getSize);
  // ZoomCtx.drawImage(zoomCanvas, 200, 200, 1000, 1000 ,0, 0, 100, 100);

  // Place the magnification tool at the same location as the pointer
  magnify.style.top = `${canvasLocation.y - 0.5 * magnifySize}px`;
  magnify.style.left = `${canvasLocation.x - 0.5 * magnifySize}px`;

  magnify.style.display = 'block';

  // Hide the mouse cursor, so the user can see better
  document.body.style.cursor = 'none';
}


/** Creates the magnifying glass canvas */
function createMagnificationCanvas (element) {
  // If the magnifying glass canvas doesn't already exist
  if ($(element).find('.magnifyTool').length === 0) {
    // Create a canvas and append it as a child to the element
    const magnify = document.createElement('canvas');
    // The magnifyTool class is used to find the canvas later on

    magnify.classList.add('magnifyTool');

    const config = magnify2.getConfiguration();

    magnify.width = config.magnifySize;
    magnify.height = config.magnifySize;

    // Make sure position is absolute so the canvas can follow the mouse / touch
    magnify.style.position = 'absolute';
    magnify.style.display = 'none';
    element.appendChild(magnify);
  }
}

/** Find the magnifying glass canvas and remove it */
function removeMagnificationCanvas (element) {
  $(element).find('.magnifyTool').remove();
}

function drawZoomedCanvas (e, eventData) {
  const enabledElement = eventData.enabledElement;
  const config = magnify2.getConfiguration();

  const magnificationLevel = config.magnificationLevel;
  const origCanvas = enabledElement.canvas;
  const image = enabledElement.image;
  const canvas = document.createElement('canvas');

  // Don't do it again
  $(enabledElement.element).off('CornerstonePreRender', drawZoomedCanvas);

  canvas.width = origCanvas.width * magnificationLevel;
  canvas.height = origCanvas.height * magnificationLevel;
  const viewport = cornerstone.getViewport(enabledElement.element);

  viewport.scale *= magnificationLevel;
  // Don't wait for animation frame, we already did
  renderImage(canvas, image, viewport);
  zoomCanvas = canvas;
  drawMagnificationTool({ element: eventData.enabledElement.element,
    currentPoints });
}

function renderImage (canvas, image, viewport) {
  const fakeEnabledElement = {};

  fakeEnabledElement.image = image;
  fakeEnabledElement.canvas = canvas;
  fakeEnabledElement.viewport = viewport;
  fakeEnabledElement.invalid = true; // Needs redraw
  // Render immediately, don't wait for animation frame
  image.render(
    fakeEnabledElement, true
  );
}

// --- Mouse tool activate / disable --- //
function disable (element) {
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  removeMagnificationCanvas(element);
}

function enable (element) {
  const config = magnify2.getConfiguration(config);

  if (!browserName) {
    const infoString = getBrowserInfo();
    const info = infoString.split(' ');

    browserName = info[0];
  }

  createMagnificationCanvas(element);
}

function activate (element, mouseButtonMask) {
  const eventData = {
    mouseButtonMask
  };

  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);

  $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
  createMagnificationCanvas(element);
}

// --- Touch tool activate / disable --- //
function getConfiguration () {
  return configuration;
}

function setConfiguration (config) {
  configuration = config;
}

// Module exports
const magnify2 = {
  enable,
  activate,
  deactivate: disable,
  disable,
  getConfiguration,
  setConfiguration
};

const options = {
  fireOnTouchStart: true,
  activateCallback: createMagnificationCanvas,
  disableCallback: removeMagnificationCanvas
};

const magnify2TouchDrag = touchDragTool(dragCallback, options);

export {
  magnify2,
  magnify2TouchDrag
};
