import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import mouseButtonTool from './mouseButtonTool.js';
import touchTool from './touchTool';
import drawTextBox from '../util/drawTextBox.js';
import roundToDecimal from '../util/roundToDecimal.js';
import toolStyle from '../stateManagement/toolStyle.js';
import textStyle from '../stateManagement/textStyle.js';
import toolColors from '../stateManagement/toolColors.js';
import drawHandles from '../manipulators/drawHandles';
import { getToolState } from '../stateManagement/toolState.js';

const toolType = 'angle';

// /////// BEGIN ACTIVE TOOL ///////
function createNewMeasurement (mouseEventData) {
  // Create the measurement data for this tool with the end handle activated
  const angleData = {
    visible: true,
    active: true,
    handles: {
      start: {
        x: mouseEventData.currentPoints.image.x - 20,
        y: mouseEventData.currentPoints.image.y + 10,
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
        y: mouseEventData.currentPoints.image.y + 10,
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
  const config = angle.getConfiguration();

  for (let i = 0; i < toolData.data.length; i++) {
    context.save();

    // Configurable shadow
    if (config && config.shadow) {
      context.shadowColor = config.shadowColor || '#000000';
      context.shadowOffsetX = config.shadowOffsetX || 1;
      context.shadowOffsetY = config.shadowOffsetY || 1;
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

    const handleStart2Canvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start2);
    const handleEnd2Canvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end2);

    context.moveTo(handleStart2Canvas.x, handleStart2Canvas.y);
    context.lineTo(handleEnd2Canvas.x, handleEnd2Canvas.y);
    context.stroke();

    // Draw the handles
    const handleOptions = {
      drawHandlesIfActive: (config && config.drawHandlesOnHover),
      hideHandlesIfMoved: (config && config.hideHandlesIfMoved)
    };

    drawHandles(context, eventData, data.handles, color, handleOptions);

    // Draw the text
    context.fillStyle = color;

    // Need to work on correct angle to measure.  This is a cobb angle and we need to determine
    // Where lines cross to measure angle. For now it will show smallest angle.
    const dx1 = (Math.ceil(data.handles.start.x) - Math.ceil(data.handles.end.x)) * eventData.image.columnPixelSpacing;
    const dy1 = (Math.ceil(data.handles.start.y) - Math.ceil(data.handles.end.y)) * eventData.image.rowPixelSpacing;
    const dx2 = (Math.ceil(data.handles.start2.x) - Math.ceil(data.handles.end2.x)) * eventData.image.columnPixelSpacing;
    const dy2 = (Math.ceil(data.handles.start2.y) - Math.ceil(data.handles.end2.y)) * eventData.image.rowPixelSpacing;

    let angle = Math.acos(Math.abs(((dx1 * dx2) + (dy1 * dy2)) / (Math.sqrt((dx1 * dx1) + (dy1 * dy1)) * Math.sqrt((dx2 * dx2) + (dy2 * dy2)))));

    angle *= (180 / Math.PI);

    const rAngle = roundToDecimal(angle, 2);
    const str = '00B0'; // Degrees symbol
    const text = rAngle.toString() + String.fromCharCode(parseInt(str, 16));

    if (!data.handles.textBox.hasMoved) {
      const textX = (data.handles.start.x + data.handles.end.x) / 2;
      const textY = (data.handles.start.y + data.handles.end.y) / 2;

      data.handles.textBox.x = textX;
      data.handles.textBox.y = textY;
    }

    const options = {
      centering: {
        x: false,
        y: true
      }
    };

    const textCoords = cornerstone.pixelToCanvas(eventData.element, data.handles.textBox);

    context.font = font;
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

    context.restore();
  }
}
// /////// END IMAGE RENDERING ///////

// Module exports
const angle = mouseButtonTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});

const angleTouch = touchTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});

export {
  angle,
  angleTouch
};
