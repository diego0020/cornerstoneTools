/* eslint no-loop-func: 0 */ // --> OFF
import external from '../externalModules.js';
import baseAnnotationTool from '../base/baseAnnotationTool.js';
// State
import { getToolState } from '../stateManagement/toolState.js';
import textStyle from '../stateManagement/textStyle.js';
import toolColors from '../stateManagement/toolColors.js';
// Manipulators
import drawHandles from '../manipulators/drawHandles.js';
// Drawing
import { getNewContext, draw } from '../util/drawing.js';
import drawTextBox from '../util/drawTextBox.js';
// Utilities
import getRGBPixels from '../util/getRGBPixels.js';
import calculateSUV from '../util/calculateSUV.js';

export default class extends baseAnnotationTool {
  constructor (name = 'probe') {
    super({
      name,
      supportedInteractionTypes: ['mouse', 'touch']
    });
  }

  /**
   * Create the measurement data for this tool with the end handle activated
   *
   * @param {*} eventData
   * @returns
   */
  createNewMeasurement (eventData) {
    const goodEventData =
      eventData && eventData.currentPoints && eventData.currentPoints.image;

    if (!goodEventData) {
      console.error(
        `required eventData not supplieed to tool ${
          this.name
        }'s createNewMeasurement`
      );

      return;
    }

    return {
      visible: true,
      active: true,
      color: undefined,
      handles: {
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true
        }
      }
    };
  }

  /**
   *
   *
   * @param {*} element
   * @param {*} data
   * @param {*} coords
   * @returns
   */
  pointNearTool (element, data, coords) {
    const hasEndHandle =
      data && data.handles && data.handles.end;
    const validParameters = hasEndHandle;

    if (!validParameters) {
      console.warn(
        `invalid parameters supplieed to tool ${this.name}'s pointNearTool`
      );
    }

    if (!validParameters || data.visible === false) {
      return false;
    }

    const probeCoords = external.cornerstone.pixelToCanvas(element, data.handles.end);

    return external.cornerstoneMath.point.distance(probeCoords, coords) < 5;
  }

  getValueStr(element, image, x, y) {
    let str,
        storedPixels;
    const seriesModule = external.cornerstone.metaData.get('generalSeriesModule', image.imageId);
    let moSuffix = '';
  
    if (seriesModule && seriesModule.modality === 'CT') {
      moSuffix = ' HU';
    }
  
    if (image.color) {
      storedPixels = getRGBPixels(element, x, y, 1, 1);
  
      const config = this.configuration;
  
      if (config.valuesmap) {
        str = config.valuesmap(image.imageId, storedPixels) + moSuffix;
      } else {
        str = 'R: ' + storedPixels[0] + ' G: ' + storedPixels[1] + ' B: ' + storedPixels[2];
      }
    } else {
      storedPixels = external.cornerstone.getStoredPixels(element, x, y, 1, 1);
      let sp = storedPixels[0];
      let mo = sp * image.slope + image.intercept;
  
      str = String(mo) + moSuffix;
    }
  
    return str;
  }

  /**
   *
   *
   * @param {*} evt
   * @returns
   */
  renderToolData (evt) {
    const eventData = evt.detail;
    const toolData = getToolState(evt.currentTarget, this.name);

    if (!toolData) {
      return;
    }

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);
    const { image } = eventData;
    const font = textStyle.getFont();
    const fontHeight = textStyle.getFontSize();

    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];

      if (data.visible === false) {
        continue;
      }

      draw(context, (context) => {

        const color = toolColors.getColorIfActive(data);
        const config = this.configuration;
        const handleRadius = config.handleRadius === undefined? 1.5 : config.handleRadius;
        // Draw the handles
        drawHandles(context, eventData, data.handles, color, {handleRadius});

        const x = Math.round(data.handles.end.x);
        const y = Math.round(data.handles.end.y);

        let cache = data.cache,
          str;

        if (x >= 0 && y >= 0 && x < image.columns && y < image.rows) {

          if (cache === undefined || cache.x !== x || cache.y !== y) {
            str = this.getValueStr(eventData.element, eventData.image, x, y);
            data.cache = {
              x: x,
              y: y,
              str: str
            };
          } else {
            str = cache.str;
          }

          // Coords for text
          const coords = {
            // Translate the x/y away from the cursor
            x: data.handles.end.x + 3,
            y: data.handles.end.y - 3
          };
          const textCoords = external.cornerstone.pixelToCanvas(eventData.element, coords);

          context.font = font;
          context.fillStyle = color;

          drawTextBox(context, str, textCoords.x, textCoords.y + fontHeight + 5, color);
        }
      });
    }
  }
}
