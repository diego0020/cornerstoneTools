import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import drawTextBox from '../util/drawTextBox.js';
import roundToDecimal from '../util/roundToDecimal.js';
import toolStyle from '../stateManagement/toolStyle.js';
import textStyle from '../stateManagement/textStyle.js';
import toolColors from '../stateManagement/toolColors.js';
import drawHandles from '../manipulators/drawHandles';
import toolCoordinates from '../stateManagement/toolCoordinates.js';
import getHandleNearImagePoint from '../manipulators/getHandleNearImagePoint.js';
import handleActivator from '../manipulators/handleActivator';
import moveHandle from '../manipulators/moveHandle';
import moveNewHandle from '../manipulators/moveNewHandle';
import moveAllHandles from '../manipulators/moveAllHandles';
import touchMoveHandle from '../manipulators/touchMoveHandle.js';
import moveNewHandleTouch from '../manipulators/moveNewHandleTouch.js';
import touchMoveAllHandles from '../manipulators/touchMoveAllHandles.js';
import anyHandlesOutsideImage from '../manipulators/anyHandlesOutsideImage.js';
import isMouseButtonEnabled from '../util/isMouseButtonEnabled.js';
import { addToolState, removeToolState, getToolState } from '../stateManagement/toolState.js';


const toolType = 'angleXen';

const options = {};
let configuration = {};
let mouseButtonMask;

// /////// BEGIN ACTIVE TOOL ///////
function createNewMeasurement (mouseEventData) {
  // Create the measurement data for this tool with the end handle activated
  const angleData = {
    visible: true,
    active: true,
    complete: false,
    handles: {
      start: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: false
      },
      end: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: true
      },
      start2: {
        x: mouseEventData.currentPoints.image.x - 20,
        y: mouseEventData.currentPoints.image.y + 20,
        highlight: true,
        active: false
      },
      end2: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y + 20,
        highlight: true,
        active: false
      },
      textBox: {
        active: false,
        hasMoved: false,
        movesIndependently: false,
        drawnIndependently: true,
        allowedOutsideImage: true,
        hasBoundingBox: true
      }
    }
  };

  return angleData;
}
// /////// END ACTIVE TOOL ///////

function pointNearTool (element, data, coords) {
  const lineSegment = {
    start: cornerstone.pixelToCanvas(element, data.handles.start),
    end: cornerstone.pixelToCanvas(element, data.handles.end)
  };

  let distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

  if (distanceToPoint < 5) {
    return true;
  }

  lineSegment.start = cornerstone.pixelToCanvas(element, data.handles.start2);
  lineSegment.end = cornerstone.pixelToCanvas(element, data.handles.end2);

  distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

  return (distanceToPoint < 5);
}

// /////// BEGIN IMAGE RENDERING ///////
function onImageRendered (e, eventData) {

  // If we have no toolData for this element, return immediately as there is nothing to do
  const toolData = getToolState(e.currentTarget, toolType);

  if (toolData === undefined) {
    return;
  }

  // We have tool data for this element - iterate over each one and draw it
  const context = eventData.canvasContext.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  // Activation color
  let color;
  const lineWidth = toolStyle.getToolWidth();
  const font = textStyle.getFont();
  const config = angleXen.getConfiguration();

  for (let i = 0; i < toolData.data.length; i++) {
    context.save();

    // Configurable shadow
    if (config && config.shadow) {
      context.shadowColor = config.shadowColor === undefined ? '#000000' : config.shadowColor;
      context.shadowOffsetX = config.shadowOffsetX === undefined ? 1 : config.shadowOffsetX;
      context.shadowOffsetX = config.shadowOffsetY === undefined ? 1 : config.shadowOffsetY;
      context.shadowBlur = config.shadowBlur === undefined ? 1 : config.shadowBlur;
    }

    const data = toolData.data[i];

    // Differentiate the color of activation tool
    if (data.active) {
      color = toolColors.getActiveColor();
    } else {
      color = toolColors.getToolColor();
    }

    // Draw the line
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;

    const handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
    const handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

    context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
    context.lineTo(handleEndCanvas.x, handleEndCanvas.y);

    const handles1 = {
      start: data.handles.start,
      end: data.handles.end
    };

    const handles2 = {
      start2: data.handles.start2,
      end2: data.handles.end2,
      textBox: data.handles.textBox
    };
    const handleStart2Canvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start2);
    const handleEnd2Canvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end2);

    if (data.complete) {

      context.moveTo(handleStart2Canvas.x, handleStart2Canvas.y);
      context.lineTo(handleEnd2Canvas.x, handleEnd2Canvas.y);
    }
    context.stroke();

    // Draw the handles
    const handleOptions = {
      drawHandlesIfActive: (config && config.drawHandlesOnHover),
      hideHandlesIfMoved: (config && config.hideHandlesIfMoved)
    };

    // Draw the handles
    drawHandles(context, eventData, handles1, color, handleOptions);
    if (data.complete) {
      drawHandles(context, eventData, handles2, color, handleOptions);
    }

    // Draw the text
    context.fillStyle = color;

    // Need to work on correct angle to measure.  This is a cobb angle and we need to determine
    // Where lines cross to measure angle. For now it will show smallest angle.

    const columnPixelSpacing = eventData.image.columnPixelSpacing || 1;
    const rowPixelSpacing = eventData.image.rowPixelSpacing || 1;
    let suffix = '';

    if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
      suffix = ' (isotropic)';
    }

    const dx1 = (Math.ceil(data.handles.start.x) - Math.ceil(data.handles.end.x)) * columnPixelSpacing;
    const dy1 = (Math.ceil(data.handles.start.y) - Math.ceil(data.handles.end.y)) * rowPixelSpacing;
    const dx2 = (Math.ceil(data.handles.start2.x) - Math.ceil(data.handles.end2.x)) * columnPixelSpacing;
    const dy2 = (Math.ceil(data.handles.start2.y) - Math.ceil(data.handles.end2.y)) * rowPixelSpacing;

    let angle = Math.acos(Math.abs(((dx1 * dx2) + (dy1 * dy2)) / (Math.sqrt((dx1 * dx1) + (dy1 * dy1)) * Math.sqrt((dx2 * dx2) + (dy2 * dy2)))));

    angle *= (180 / Math.PI);

    const rAngle = roundToDecimal(angle, 2);
    const str = '00B0'; // Degrees symbol
    const text = rAngle.toString() + String.fromCharCode(parseInt(str, 16)) + suffix;

    if (!data.handles.textBox.hasMoved) {
      const textX = (data.handles.start.x + data.handles.end.x) / 2;
      const textY = (data.handles.start.y + data.handles.end.y) / 2 - 10;

      data.handles.textBox.x = textX;
      data.handles.textBox.y = textY;
    }

    options.centering = {
      x: false,
      y: true
    };

    const textCoords = cornerstone.pixelToCanvas(eventData.element, data.handles.textBox);

    context.font = font;
    if (data.complete) {
      const boundingBox = drawTextBox(context, text, textCoords.x, textCoords.y, color, options);

      data.handles.textBox.boundingBox = boundingBox;


      if (data.handles.textBox.hasMoved) {
        // Draw dashed link line between ellipse and text
        const link = {
          start: {},
          end: {}
        };

        const midpointCanvas = {
          x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
          y: (handleStartCanvas.y + handleEndCanvas.y) / 2
        };

        const midpointCanvas2 = {
          x: (handleStart2Canvas.x + handleEnd2Canvas.x) / 2,
          y: (handleStart2Canvas.y + handleEnd2Canvas.y) / 2
        };

        const points = [handleStartCanvas, handleEndCanvas, midpointCanvas, handleStart2Canvas, handleEnd2Canvas, midpointCanvas2];

        link.end.x = textCoords.x;
        link.end.y = textCoords.y;

        link.start = cornerstoneMath.point.findClosestPoint(points, link.end);

        const boundingBoxPoints = [{
          // Top middle point of bounding box
          x: boundingBox.left + boundingBox.width / 2,
          y: boundingBox.top
        }, {
          // Left middle point of bounding box
          x: boundingBox.left,
          y: boundingBox.top + boundingBox.height / 2
        }, {
          // Bottom middle point of bounding box
          x: boundingBox.left + boundingBox.width / 2,
          y: boundingBox.top + boundingBox.height
        }, {
          // Right middle point of bounding box
          x: boundingBox.left + boundingBox.width,
          y: boundingBox.top + boundingBox.height / 2
        }
        ];

        link.end = cornerstoneMath.point.findClosestPoint(boundingBoxPoints, link.start);

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.setLineDash([2, 3]);
        context.moveTo(link.start.x, link.start.y);
        context.lineTo(link.end.x, link.end.y);
        context.stroke();
      }
    }

    context.restore();

  }
}
// /////// END IMAGE RENDERING ///////

// Tool Interface


function getIncomplete (target) {
  const toolData = getToolState(target, toolType);

  if (toolData === undefined) {
    return;
  }

  for (let i = 0; i < toolData.data.length; i++) {
    if (toolData.data[i].complete === false) {
      return toolData.data[i];
    }
  }
}


// /////// BEGIN ACTIVE TOOL ///////
function addNewMeasurement (mouseEventData) {
  const element = mouseEventData.element;
  // Hide the mouse cursor, so the user can see better

  document.body.style.cursor = 'none';

  const eventData = {
    mouseButtonMask
  };

  let measurementData;
  let toMoveHandle;

  // Search for incomplete measurements
  const maybePending = getIncomplete(mouseEventData.element);

  if (maybePending) {
    measurementData = maybePending;
    measurementData.complete = true;
    measurementData.handles.start2 = {
      x: mouseEventData.currentPoints.image.x,
      y: mouseEventData.currentPoints.image.y,
      highlight: true,
      active: false
    };
    measurementData.handles.end2 = {
      x: mouseEventData.currentPoints.image.x,
      y: mouseEventData.currentPoints.image.y,
      highlight: true,
      active: true
    };
    toMoveHandle = measurementData.handles.end2;

  } else {


    measurementData = createNewMeasurement(mouseEventData);
    if (!measurementData) {
      return;
    }
    addToolState(mouseEventData.element, toolType, measurementData);
    toMoveHandle = measurementData.handles.end;

  }


  // Associate this data with this imageId so we can render it and manipulate it

  // Since we are dragging to another place to drop the end point, we can just activate
  // The end point and let the moveHandle move it for us.
  $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);
  $(element).off('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).off('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);

  cornerstone.updateImage(element);

  const handleMover = mouseEventData.isTouchEvent ? moveNewHandleTouch : moveNewHandle;
  const preventHandleOutsideImage = true;

  measurementData.handles.end.isMoving = false;
  measurementData.handles.end2.isMoving = false;


  handleMover(mouseEventData, toolType, measurementData, toMoveHandle, function () {
    measurementData.active = false;
    // Re-enable the mouse cursor
    document.body.style.cursor = 'default';
    measurementData.invalidated = true;
    if (anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
      // Delete the measurement
      removeToolState(element, toolType, measurementData);
    }

    $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
    $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
    $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseDownActivateCallback);

    $(element).on('CornerstoneToolsTouchStart', eventData, mouseDownCallback);
    $(element).on('CornerstoneToolsTouchStartActive', eventData, mouseDownActivateCallback);

    const eventType = 'CornerstoneToolsMeasurementFinished';

    toMoveHandle.isMoving = false;
    const endEventData = {
      toolType,
      element,
      measurementData
    };

    $(element).trigger(eventType, endEventData);

    cornerstone.updateImage(element);
  }, preventHandleOutsideImage);
}

function mouseDownActivateCallback (e, eventData) {

  if (eventData.isTouchEvent || isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
    addNewMeasurement(eventData);

    return false; // False = causes jquery to preventDefault() and stopPropagation() this event
  }
}

// /////// END ACTIVE TOOL ///////

// /////// BEGIN DEACTIVE TOOL ///////

function mouseMoveCallback (e, eventData) {
  toolCoordinates.setCoords(eventData);
  // If a mouse button is down, do nothing
  if (eventData.which !== 0) {
    return;
  }

  // If we have no tool data for this element, do nothing
  const toolData = getToolState(eventData.element, toolType);

  if (!toolData) {
    return;
  }

  // We have tool data, search through all data
  // And see if we can activate a handle
  let imageNeedsUpdate = false;

  for (let i = 0; i < toolData.data.length; i++) {
    // Get the cursor position in canvas coordinates
    const coords = eventData.currentPoints.canvas;

    const data = toolData.data[i];

    if (handleActivator(eventData.element, data.handles, coords) === true) {
      imageNeedsUpdate = true;
    }

    if ((pointNearTool(eventData.element, data, coords) && !data.active) || (!pointNearTool(eventData.element, data, coords) && data.active)) {
      data.active = !data.active;
      imageNeedsUpdate = true;
    }
  }

  // Handle activation status changed, redraw the image
  if (imageNeedsUpdate === true) {
    cornerstone.updateImage(eventData.element);
  }
}

function mouseDownCallback (e, eventData) {
  let data;
  const element = eventData.element;

  function handleDoneMove () {
    // Re-enable the mouse cursor
    document.body.style.cursor = 'default';
    for (const hk in data.handles) {
      data.handles[hk].isMoving = false;
    }
    data.invalidated = true;
    if (anyHandlesOutsideImage(eventData, data.handles)) {
      // Delete the measurement
      removeToolState(element, toolType, data);
    }

    cornerstone.updateImage(element);
    $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
  }

  if (!eventData.isTouchEvent && !isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
    return;
  }

  const coords = eventData.startPoints.canvas;
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

  let i;

  // Now check to see if there is a handle we can move

  const preventHandleOutsideImage = false;

  for (i = 0; i < toolData.data.length; i++) {
    data = toolData.data[i];
    const distance = 6;
    const handle = getHandleNearImagePoint(element, data.handles, coords, distance);

    if (handle) {
      handle.isMoving = false;
      // Hide the mouse cursor, so the user can see better
      document.body.style.cursor = 'none';
      $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
      data.active = true;
      const handleMover = eventData.isTouchEvent ? touchMoveHandle : moveHandle;

      handleMover(eventData, toolType, data, handle, handleDoneMove, preventHandleOutsideImage);

      e.stopImmediatePropagation();

      return false;
    }
  }


  for (i = 0; i < toolData.data.length; i++) {
    data = toolData.data[i];
    data.active = false;
    if (pointNearTool(element, data, coords)) {
      data.active = true;
      $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
      const handlesMover = eventData.isTouchEvent ? touchMoveAllHandles : moveAllHandles;

      handlesMover(e, data, toolData, toolType, options, handleDoneMove);
      e.stopImmediatePropagation();

      return false;
    }
  }
}
// /////// END DEACTIVE TOOL ///////

// Not visible, not interactive
function disable (element) {
  $(element).off('CornerstoneImageRendered', onImageRendered);
  $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

  const maybePending = getIncomplete(element);

  if (maybePending) {
    removeToolState(element, toolType, maybePending);
  }

  cornerstone.updateImage(element);
}

// Visible but not interactive
function enable (element) {
  $(element).off('CornerstoneImageRendered', onImageRendered);
  $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);


  $(element).on('CornerstoneImageRendered', onImageRendered);

  cornerstone.updateImage(element);
}

// Visible, interactive and can create
function activate (element, mouseButtonMaskIn) {
  const eventData = {
    mouseButtonMask: mouseButtonMaskIn
  };

  mouseButtonMask = mouseButtonMaskIn;

  $(element).off('CornerstoneImageRendered', onImageRendered);
  $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

  $(element).on('CornerstoneImageRendered', onImageRendered);
  $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
  $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
  $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseDownActivateCallback);

  cornerstone.updateImage(element);
}


// Visible, interactive
function deactivate (element, mouseButtonMask) {
  const eventData = {
    mouseButtonMask
  };

  const eventType = 'CornerstoneToolsToolDeactivated';
  const statusChangeEventData = {
    mouseButtonMask,
    toolType,
    type: eventType
  };

  const event = $.Event(eventType, statusChangeEventData);

  $(element).trigger(event, statusChangeEventData);

  $(element).off('CornerstoneImageRendered', onImageRendered);
  $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
  $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
  $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

  $(element).on('CornerstoneImageRendered', onImageRendered);
  $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
  $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);

  const maybePending = getIncomplete(element);

  if (maybePending) {
    removeToolState(element, toolType, maybePending);
  }

  cornerstone.updateImage(element);
}

function activateTouch (element) {
  $(element).off('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).off('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);
  $(element).off('CornerstoneImageRendered', onImageRendered);

  $(element).on('CornerstoneImageRendered', onImageRendered);
  $(element).on('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).on('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);

  cornerstone.updateImage(element);
}

function deactivateTouch (element) {

  const eventType = 'CornerstoneToolsToolDeactivated';
  const statusChangeEventData = {
    mouseButtonMask,
    toolType,
    type: eventType
  };

  const event = $.Event(eventType, statusChangeEventData);

  $(element).trigger(event, statusChangeEventData);

  $(element).off('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).off('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);
  $(element).off('CornerstoneImageRendered', onImageRendered);

  $(element).on('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).on('CornerstoneImageRendered', onImageRendered);

  const maybePending = getIncomplete(element);

  if (maybePending) {
    removeToolState(element, toolType, maybePending);
  }

  cornerstone.updateImage(element);
}

function disableTouch (element) {

  $(element).off('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).off('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);
  $(element).off('CornerstoneImageRendered', onImageRendered);

  const maybePending = getIncomplete(element);

  if (maybePending) {
    removeToolState(element, toolType, maybePending);
  }

  cornerstone.updateImage(element);
}

// Visible but not interactive
function enableTouch (element) {

  $(element).off('CornerstoneToolsTouchStart', mouseDownCallback);
  $(element).off('CornerstoneToolsTouchStartActive', mouseDownActivateCallback);
  $(element).off('CornerstoneImageRendered', onImageRendered);

  $(element).on('CornerstoneImageRendered', onImageRendered);

  cornerstone.updateImage(element);
}


function getConfiguration () {
  return configuration;
}

function setConfiguration (config) {
  configuration = config;
}

const toolInterface = {
  enable,
  disable,
  activate,
  deactivate,
  getConfiguration,
  setConfiguration,
  mouseDownCallback,
  mouseMoveCallback,
  mouseDownActivateCallback,
  pointNearTool,
  addNewMeasurement
};

const touchInterface = {
  enable: enableTouch,
  disable: disableTouch,
  activate: activateTouch,
  deactivate: deactivateTouch,
  mouseDownCallback,
  mouseDownActivateCallback,
  tapCallback () { }
};

const angleXen = toolInterface;
const angleXenTouch = touchInterface;

export {
  angleXen,
  angleXenTouch
};
