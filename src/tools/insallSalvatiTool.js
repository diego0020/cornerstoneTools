/* eslint no-loop-func: 0 */ // --> OFF
/* eslint class-methods-use-this: 0 */ // --> OFF
import external from '../externalModules.js';
import baseAnnotationTool from '../base/baseAnnotationTool.js';
// State
import textStyle from '../stateManagement/textStyle.js';
import {
  addToolState,
  getToolState,
  removeToolState
} from '../stateManagement/toolState.js';
import toolStyle from '../stateManagement/toolStyle.js';
import toolColors from '../stateManagement/toolColors.js';
// Manipulators
import drawHandles from '../manipulators/drawHandles.js';
import moveNewHandle from '../manipulators/moveNewHandle.js';
import moveNewHandleTouch from '../manipulators/moveNewHandleTouch.js';
import anyHandlesOutsideImage from '../manipulators/anyHandlesOutsideImage.js';
import drawTextBox from '../util/drawTextBox.js';
import drawLink from '../util/drawLink.js';
// Drawing
import {
  getNewContext,
  draw,
  setShadow,
  drawLine
} from '../util/drawing.js';
import drawLinkedTextBox from '../util/drawLinkedTextBox.js';
import lineSegDistance from '../util/lineSegDistance.js';
import roundToDecimal from '../util/roundToDecimal.js';
import EVENTS from './../events.js';
import triggerEvent from '../util/triggerEvent.js';

export default class extends baseAnnotationTool {
  constructor(name = 'insallSalvati') {
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
  createNewMeasurement(eventData) {
    // Create the measurement data for this tool with the end handle activated
    return {
      visible: true,
      active: true,
      color: undefined,
      complete: false,
      ratio: undefined,
      lengthA: undefined,
      lengthB: undefined,
      rangle: undefined,
      handles: {
        start: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: false
        },
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true
        },
        start2: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: false,
          drawnIndependently: true
        },
        end2: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: false,
          drawnIndependently: true
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
  }

  /**
   *
   *
   * @param {*} element
   * @param {*} data
   * @param {*} coords
   * @returns
   */
  pointNearTool(element, data, coords) {
    if (data.visible === false) {
      return false;
    }

    const maybePending = this.getIncomplete(element);

    if (maybePending) {
      // measurement in progress
      return false;
    }

    return (
      lineSegDistance(
        element,
        data.handles.start,
        data.handles.end,
        coords
      ) < 25 ||
      lineSegDistance(element, data.handles.start2, data.handles.end2, coords) <
      25
    );
  }

  /**
   *
   *
   * @param {*} evt
   * @returns
   */
  renderToolData(evt) {
    const eventData = evt.detail;
    // If we have no toolData for this element, return immediately as there is nothing to do
    const toolData = getToolState(evt.currentTarget, this.name);

    if (!toolData) {
      return;
    }

    // We have tool data for this element - iterate over each one and draw it
    const context = getNewContext(eventData.canvasContext.canvas);

    const lineWidth = toolStyle.getToolWidth();
    const font = textStyle.getFont();
    const config = this.configuration;

    const image = external.cornerstone.getEnabledElement(eventData.element).image;
    const imagePlane = external.cornerstone.metaData.get(
      'imagePlaneModule',
      image.imageId
    );
    let rowPixelSpacing;
    let colPixelSpacing;

    if (imagePlane) {
      rowPixelSpacing =
        imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing;
      colPixelSpacing =
        imagePlane.columnPixelSpacing || imagePlane.colImagePixelSpacing;
    } else {
      rowPixelSpacing = image.rowPixelSpacing;
      colPixelSpacing = image.columnPixelSpacing;
    }    

    for (let i = 0; i < toolData.data.length; i++) {
      const data = toolData.data[i];

      if (data.visible === false) {
        continue;
      }

      draw(context, (context) => {
        setShadow(context, config);

        // Differentiate the color of activation tool
        const color = toolColors.getColorIfActive(data);

        drawLine(context, eventData.element, data.handles.start, data.handles.end, {
          color
        });


        if (data.complete) {
          drawLine(context, eventData.element, data.handles.start2, data.handles.end2, {
            color
          });
        }

        // Draw the handles
        const handleOptions = {
          drawHandlesIfActive: config && config.drawHandlesOnHover,
          hideHandlesIfMoved: config && config.hideHandlesIfMoved
        };

        drawHandles(context, eventData, data.handles, color, handleOptions);

        // Draw the text
        context.fillStyle = color;

        const text = textBoxText(data);

        if (!data.handles.textBox.hasMoved) {
          let textCoords;
          textCoords = {
            x: (data.handles.start.x + data.handles.end.x) / 2 + 20,
            y: (data.handles.start.y + data.handles.end.y) / 2 + 30
          };

          context.font = font;
          data.handles.textBox.x = textCoords.x;
          data.handles.textBox.y = textCoords.y;
        }

        this.drawSalvatiTextBox(
          context,
          eventData.element,
          data.handles.textBox,
          text,
          data.handles,
          textBoxAnchorPointLine1,
          textBoxAnchorPointLine2,
          color,
          lineWidth,
          0,
          true
        );

      });
    }

    function textBoxText(data) {
      const { lengthA, lengthB, ratio } = data;

      // Set the length text suffix depending on whether or not pixelSpacing is available
      let suffix = ' mm';

      if (!rowPixelSpacing || !colPixelSpacing) {
        suffix = ' pixels';
      }

      // Define an array to store the rows of text for the textbox
      const textLines = [];
      if (ratio) {
        textLines.push(`ratio A/B: ${ratio}`);
      }
      if (lengthA) {
        textLines.push(`length A: ${lengthA} ${suffix}`);
      }
      if (lengthB) {
        textLines.push(`length B: ${lengthB} ${suffix}`);        
      }

      return textLines;
    }

    function textBoxAnchorPoints(handles) {
      return [handles.start, handles.start2, handles.end, handles.end2];
    }

    function textBoxAnchorPointLine1(handles) {
      const distSS = Math.abs(handles.start.x - handles.start2.x) + Math.abs(handles.start.y - handles.start2.y);
      const distSE = Math.abs(handles.start.x - handles.end2.x) + Math.abs(handles.start.y - handles.end2.y);
      const distES = Math.abs(handles.end.x - handles.start2.x) + Math.abs(handles.end.y - handles.start2.y);
      const distEE = Math.abs(handles.end.x - handles.end2.x) + Math.abs(handles.end.y - handles.end2.y);
      const minS = Math.min(distSS, distSE);
      const minE = Math.min(distES, distEE);
      if (minS < minE) {
        return [handles.start];
      } else {
        return [handles.end];
      }
    }

    function textBoxAnchorPointLine2(handles) {
      const distSS = Math.abs(handles.start2.x - handles.start.x) + Math.abs(handles.start2.y - handles.start.y);
      const distSE = Math.abs(handles.start2.x - handles.end.x) + Math.abs(handles.start2.y - handles.end.y);
      const distES = Math.abs(handles.end2.x - handles.start.x) + Math.abs(handles.end2.y - handles.start.y);
      const distEE = Math.abs(handles.end2.x - handles.end.x) + Math.abs(handles.end2.y - handles.end.y);
      const minS = Math.min(distSS, distSE);
      const minE = Math.min(distES, distEE);
      if (minS < minE) {
        return [handles.start2];
      } else {
        return [handles.end2];
      }
    }
  }

  getIncomplete(target) {
    const toolData = getToolState(target, this.name);

    if (toolData === undefined) {
      return;
    }

    for (let i = 0; i < toolData.data.length; i++) {
      if (toolData.data[i].complete === false) {
        return toolData.data[i];
      }
    }
  }

  addNewMeasurement(evt, interactionType) {

    evt.preventDefault();
    evt.stopPropagation();

    const eventData = evt.detail;

    let measurementData;
    let toMoveHandle;

    // Search for incomplete measurements
    const element = evt.detail.element;
    const maybePending = this.getIncomplete(element);

    if (maybePending) {
      measurementData = maybePending;
      measurementData.complete = true;
      measurementData.handles.start2 = {
        x: eventData.currentPoints.image.x,
        y: eventData.currentPoints.image.y,
        drawnIndependently: false,
        highlight: true,
        active: false
      };
      measurementData.handles.end2 = {
        x: eventData.currentPoints.image.x,
        y: eventData.currentPoints.image.y,
        drawnIndependently: false,
        highlight: true,
        active: true
      };
      toMoveHandle = measurementData.handles.end2;
    } else {
      measurementData = this.createNewMeasurement(eventData);
      addToolState(element, this.name, measurementData);
      toMoveHandle = measurementData.handles.end;
    }

    // MoveHandle, moveNewHandle, moveHandleTouch, and moveNewHandleTouch
    // All take the same parameters, but register events differentlIy.
    const handleMover =
      interactionType === 'mouse' ? moveNewHandle : moveNewHandleTouch;

    // Associate this data with this imageId so we can render it and manipulate it
    external.cornerstone.updateImage(element);

    handleMover(
      eventData,
      this.name,
      measurementData,
      toMoveHandle,
      () => {
        measurementData.active = false;
        measurementData.handles.end.active = true;

        // TODO: `anyHandlesOutsideImage` deletion should be a config setting
        // TODO: Maybe globally? Mayber per tool?
        // If any handle is outside image, delete and abort
        if (anyHandlesOutsideImage(eventData, measurementData.handles)) {
          // Delete the measurement
          removeToolState(element, this.name, measurementData);
        }
        const eventType = EVENTS.MEASUREMENT_FINISHED;

        toMoveHandle.isMoving = false;
        if (measurementData.complete) {
          const endEventData = {
            toolType: this.name,
            element: element,
            measurementData: measurementData
          };

          triggerEvent(element, eventType, endEventData);
        }

        external.cornerstone.updateImage(element);
      }
    );
  }

  onMeasureModified(ev) {

    const image = external.cornerstone.getEnabledElement(ev.detail.element).image;
    if (ev.detail.toolType !== this.name) {
      return;
    }
    const data = ev.detail.measurementData;
    const imagePlane = external.cornerstone.metaData.get(
      'imagePlaneModule',
      image.imageId
    );
    let rowPixelSpacing;
    let colPixelSpacing;

    if (imagePlane) {
      rowPixelSpacing =
        imagePlane.rowPixelSpacing || imagePlane.rowImagePixelSpacing;
      colPixelSpacing =
        imagePlane.columnPixelSpacing || imagePlane.colImagePixelSpacing;
    } else {
      rowPixelSpacing = image.rowPixelSpacing;
      colPixelSpacing = image.columnPixelSpacing;
    }

    // Set rowPixelSpacing and columnPixelSpacing to 1 if they are undefined (or zero)
    const dx1 = (data.handles.end.x - data.handles.start.x) * (colPixelSpacing || 1);
    const dy1 = (data.handles.end.y - data.handles.start.y) * (rowPixelSpacing || 1);
    // Calculate the length, and create the text variable with the millimeters or pixels suffix
    const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    
    // Set rowPixelSpacing and columnPixelSpacing to 1 if they are undefined (or zero)
    const dx2 = (data.handles.end2.x - data.handles.start2.x) * (colPixelSpacing || 1);
    const dy2 = (data.handles.end2.y - data.handles.start2.y) * (rowPixelSpacing || 1);
    // Calculate the length, and create the text variable with the millimeters or pixels suffix
    const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    // Store the length inside the tool for outside access

    if (length1 && !Number.isNaN(length1)) {
      data.lengthA = roundToDecimal(length1,2);
    }
    if (length2 && !Number.isNaN(length2) ) {
      data.lengthB = roundToDecimal(length2,2);
    }
    if (length1 && length2) {
      if (length2 !== 0) {
        data.ratio = roundToDecimal(length2 / length1, 4);
      }
    }

    // let angle = Math.acos(Math.abs(((dx1 * dx2) + (dy1 * dy2)) / (Math.sqrt((dx1 * dx1) + (dy1 * dy1)) * Math.sqrt((dx2 * dx2) + (dy2 * dy2)))));
    // angle *= (180 / Math.PI);
    // const rAngle = roundToDecimal(angle, 2);
    // if (!Number.isNaN(rAngle)) {
    //   data.rAngle = rAngle;
    // }
  }

  activeCallback(element) {
    this.onMeasureModified = this.onMeasureModified.bind(this);
    element.addEventListener(EVENTS.MEASUREMENT_MODIFIED, this.onMeasureModified);
  }

  passiveCallback(element) {
    this.onMeasureModified = this.onMeasureModified.bind(this);
    element.addEventListener(EVENTS.MEASUREMENT_MODIFIED, this.onMeasureModified);
  }

  enabledCallback(element) {
    element.removeEventListener(EVENTS.MEASUREMENT_MODIFIED, this.onMeasureModified);

  }

  disabledCallback(element) {
    element.removeEventListener(EVENTS.MEASUREMENT_MODIFIED, this.onMeasureModified);
  }
 
  drawSalvatiTextBox (context, element, textBox, text,
    handles, textBoxAnchorPointsL1, textBoxAnchorPointsL2, color, lineWidth, xOffset, yCenter) {

    const cornerstone = external.cornerstone;
    const textCoords = cornerstone.pixelToCanvas(element, textBox);
  
    if (xOffset) {
      textCoords.x += xOffset;
    }
  
    const options = {
      centering: {
        x: false,
        y: yCenter
      }
    };

    let x = 0;
    let y = 0;
    const dx = handles.start.x - handles.end.x;
    const dy = handles.start.y - handles.end.y;
    if (dx !== 0 || dy !== 0) {
      x = (handles.start.x + handles.end.x) / 2.0;
      y = (handles.start.y + handles.end.y) / 2.0;
      const posTextA = { x, y };
      const lineCoordsA = cornerstone.pixelToCanvas(element, posTextA);
      drawTextBox(context, 'A', lineCoordsA.x, lineCoordsA.y, color, options);
    }
    const dx2  = handles.start2.x - handles.end2.x;
    const dy2  = handles.start2.y - handles.end2.y;
    if (dx2 !== 0 || dy2 !== 0) {
      x = (handles.start2.x + handles.end2.x) / 2.0;
      y = (handles.start2.y + handles.end2.y) / 2.0;
      const posTextB = { x, y };
      const lineCoordsB = cornerstone.pixelToCanvas(element, posTextB);
      drawTextBox(context, 'B', lineCoordsB.x, lineCoordsB.y, color, options);
    }
    
    // Draw the text box
    textBox.boundingBox = drawTextBox(context, text, textCoords.x, textCoords.y, color, options);
    if (textBox.hasMoved) {
      // Draw dashed line between first line and text
      const linkAnchorPointsL1 = textBoxAnchorPointsL1(handles).map((h) => cornerstone.pixelToCanvas(element, h));
      drawLink(linkAnchorPointsL1, textCoords, textBox.boundingBox, context, color, lineWidth);
      // Draw dashed line between second line and text
      const linkAnchorPointsL2 = textBoxAnchorPointsL2(handles).map((h) => cornerstone.pixelToCanvas(element, h));
      drawLink(linkAnchorPointsL2, textCoords, textBox.boundingBox, context, color, lineWidth);
    }
  }
}

