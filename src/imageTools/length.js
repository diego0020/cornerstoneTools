import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import mouseButtonTool from './mouseButtonTool.js';
import touchTool from './touchTool';
import drawTextBox from '../util/drawTextBox.js';
import toolStyle from '../stateManagement/toolStyle.js';
import toolColors from '../stateManagement/toolColors.js';
import drawHandles from '../manipulators/drawHandles';
import { getToolState } from '../stateManagement/toolState.js';

const toolType = 'length';

// /////// BEGIN ACTIVE TOOL ///////
function createNewMeasurement (mouseEventData) {
  // Create the measurement data for this tool with the end handle activated
  const measurementData = {
    visible: true,
    active: true,
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

  return measurementData;
}
// /////// END ACTIVE TOOL ///////

function pointNearTool (element, data, coords) {
  const dStart = cornerstoneMath.point.distanceSquared(
    cornerstone.pixelToCanvas(element, data.handles.start), coords);
  const dEnd = cornerstoneMath.point.distanceSquared(
    cornerstone.pixelToCanvas(element, data.handles.end), coords);

  return (dStart < 25 || dEnd < 25);
}

// /////// BEGIN IMAGE RENDERING ///////
function onImageRendered (e, eventData) {
  // If we have no toolData for this element, return immediately as there is nothing to do
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

  // We have tool data for this element - iterate over each one and draw it
  const context = eventData.canvasContext.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  const lineWidth = toolStyle.getToolWidth();
  const config = length.getConfiguration();

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
    const color = toolColors.getColorIfActive(data.active);

    // Get the handle positions in canvas coordinates
    const handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
    const handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

    // Draw the measurement line
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
    context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
    context.stroke();

    // Draw the handles
    const handleOptions = {
      drawHandlesIfActive: (config && config.drawHandlesOnHover),
      hideHandlesIfMoved: (config && config.hideHandlesIfMoved)
    };

    drawHandles(context, eventData, data.handles, color, handleOptions);

    // Draw the text
    context.fillStyle = color;

    // Set rowPixelSpacing and columnPixelSpacing to 1 if they are undefined (or zero)
    const dx = (data.handles.end.x - data.handles.start.x) * (eventData.image.columnPixelSpacing || 1);
    const dy = (data.handles.end.y - data.handles.start.y) * (eventData.image.rowPixelSpacing || 1);

    // Calculate the length, and create the text variable with the millimeters or pixels suffix
    const length = Math.sqrt(dx * dx + dy * dy);

    // Store the length inside the tool for outside access
    data.length = length;

    // Set the length text suffix depending on whether or not pixelSpacing is available
    let suffix = ' mm';

    if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
      suffix = ' pixels';
    }

    // Store the length measurement text
    const text = `${length.toFixed(2)}${suffix}`;

    if (!data.handles.textBox.hasMoved) {
      const coords = {
        x: Math.max(data.handles.start.x, data.handles.end.x)
      };

      // Depending on which handle has the largest x-value,
      // Set the y-value for the text box
      if (coords.x === data.handles.start.x) {
        coords.y = data.handles.start.y;
      } else {
        coords.y = data.handles.end.y;
      }

      data.handles.textBox.x = coords.x;
      data.handles.textBox.y = coords.y;
    }

    const textCoords = cornerstone.pixelToCanvas(eventData.element, data.handles.textBox);

    // Move the textbox slightly to the right and upwards
    // So that it sits beside the length tool handle
    textCoords.x += 10;

    const options = {
      centering: {
        x: false,
        y: true
      }
    };

    // Draw the textbox
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

      const points = [handleStartCanvas, handleEndCanvas, midpointCanvas];

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

    context.restore();
  }
}
// /////// END IMAGE RENDERING ///////

// Module exports
const length = mouseButtonTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});

const lengthTouch = touchTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});

export {
  length,
  lengthTouch
};
