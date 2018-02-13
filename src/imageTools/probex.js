import * as cornerstone from 'cornerstone-core';
import * as cornerstoneMath from 'cornerstone-math';
import mouseButtonTool from './mouseButtonTool.js';
import touchTool from './touchTool';
import toolColors from '../stateManagement/toolColors.js';
import textStyle from '../stateManagement/textStyle.js';
import drawHandles from '../manipulators/drawHandles';
import drawTextBox from '../util/drawTextBox';
import getRGBPixels from '../util/getRGBPixels';
import { getToolState } from '../stateManagement/toolState.js';

const toolType = 'probex';

// /////// BEGIN ACTIVE TOOL ///////
function createNewMeasurement (mouseEventData) {
  // Create the measurement data for this tool with the end handle activated
  const measurementData = {
    visible: true,
    active: true,
    handles: {
      end: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: true
      }
    }
  };


  return measurementData;
}
// /////// END ACTIVE TOOL ///////

// /////// BEGIN IMAGE RENDERING ///////
function pointNearTool (element, data, coords) {
  const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);


  return cornerstoneMath.point.distanceSquared(endCanvas, coords) < 25;
}

function getValueStr (element, image, x, y) {
  let str, storedPixels;
  const seriesModule = cornerstone.metaData.get('generalSeriesModule', image.imageId);
  let moSuffix = '';

  if (seriesModule && seriesModule.modality === 'CT') {
    moSuffix = ' HU';
  }

  if (image.color) {
    storedPixels = getRGBPixels(element, x, y, 1, 1);

    const config = probex.getConfiguration();

    if (config.valuesmap) {
      str = config.valuesmap(image.imageId, storedPixels) + moSuffix;
    } else {
      str = `R: ${storedPixels[0]} G: ${storedPixels[1]} B: ${storedPixels[2]}`;
    }
  } else {
    storedPixels = cornerstone.getStoredPixels(element, x, y, 1, 1);
    const sp = storedPixels[0];
    const mo = sp * image.slope + image.intercept;

    str = String(mo) + moSuffix;
  }

  return str;
}

function onImageRendered (e, eventData) {
  // If we have no toolData for this element, return immediately as there is nothing to do
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

  // We have tool data for this element - iterate over each one and draw it
  const context = eventData.canvasContext.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  let color;
  const font = textStyle.getFont();
  const fontHeight = textStyle.getFontSize();

  for (let i = 0; i < toolData.data.length; i++) {

    context.save();
    const data = toolData.data[i];
    const config = probex.getConfiguration();

    if (config && config.shadow) {
      context.shadowColor = config.shadowColor === undefined ? '#000000' : config.shadowColor;
      context.shadowOffsetX = config.shadowOffsetX === undefined ? 1 : config.shadowOffsetX;
      context.shadowOffsetX = config.shadowOffsetY === undefined ? 1 : config.shadowOffsetY;
      context.shadowBlur = config.shadowBlur === undefined ? 1 : config.shadowBlur;
    }

    const handleRadius = config.handleRadius === undefined ? 1.5 : config.handleRadius;

    if (data.active) {
      color = toolColors.getActiveColor();
    } else {
      color = toolColors.getToolColor();
    }

    // Draw the handles
    drawHandles(context, eventData, data.handles, color, {
      handleRadius
    });

    const x = Math.round(data.handles.end.x);
    const y = Math.round(data.handles.end.y);

    if (x < 0 || y < 0 || x >= eventData.image.columns || y >= eventData.image.rows) {
      return;
    }

    const cache = data.cache;
    let str;

    if (cache === undefined || cache.x !== x || cache.y !== y) {
      str = getValueStr(eventData.element, eventData.image, x, y);
      data.cache = {
        x,
        y,
        str
      };
    }else {
      str = cache.str;
    }

    const coords = {
      // Translate the x/y away from the cursor
      x: data.handles.end.x + 3,
      y: data.handles.end.y - 3
    };
    const textCoords = cornerstone.pixelToCanvas(eventData.element, coords);

    context.font = font;
    context.fillStyle = color;

    drawTextBox(context, str, textCoords.x, textCoords.y + fontHeight + 5, color);
    // DrawTextBox(context, text, textCoords.x, textCoords.y, color);
    context.restore();
  }
}
// /////// END IMAGE RENDERING ///////

// Module exports
const probex = mouseButtonTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});
const probexTouch = touchTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});

export {
  probex,
  probexTouch
};
