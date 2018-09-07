/* eslint no-loop-func: 0 */ // --> OFF
/* eslint no-underscore-dangle: 0 */
import baseTool from './../base/baseTool.js';
import external from './../externalModules.js';
import EVENTS from './../events.js';

import loadHandlerManager from '../stateManagement/loadHandlerManager.js';
import { addToolState, getToolState, clearToolState } from '../stateManagement/toolState.js';
import { imagePointToPatientPoint, projectPatientPointToImagePlane } from '../util/pointProjector.js';
import convertToVector3 from '../util/convertToVector3.js';
import { setToolOptions } from '../toolOptions.js';
import { getNewContext } from '../util/drawing.js';
import toolColors from '../stateManagement/toolColors.js';

var imageIdSource = '';
var sourceEl = '';
var patientPoint = {x: 0, y: 0};
var imageIdsTarget = [];

export default class extends baseTool {

  constructor (name = 'triangulation') {
    super({
      name,
      supportedInteractionTypes: ['mouse', 'touch']
    });

    // Mouse
    this.mouseDownCallback = this._chooseLocation.bind(this);
    this.mouseDragCallback = this._chooseLocation.bind(this);
    this.mouseClickCallback = this._chooseLocation.bind(this);

    // Drag
    this.touchDragCallback = this._chooseLocation.bind(this);
    this.postTouchStartCallback = this._chooseLocation.bind(this);

    this.onTriangulationRendered = this.onTriangulationRendered.bind(this);
    this.clearMeasurements = this.clearMeasurements.bind(this);
    this.hasCursor = true;
  }

  _chooseLocation (evt) {
    const eventData = evt.detail;
    const { element } = eventData;

    this.createNewMeasurement(eventData);
    // Prevent CornerstoneToolsTouchStartActive from killing any press events
    evt.stopImmediatePropagation();

    // If we have no toolData for this element, return immediately as there is nothing to do
    const toolData = getToolState(element, this.name);

    if (!toolData) {
      return;
    }

    // Save current image id
    const stackDataSource = getToolState(element, 'stack');
    const imageIdsSource = stackDataSource.data[0].imageIds;
    const currentImageIdIndexSource = stackDataSource.data[0].currentImageIdIndex;
    imageIdSource = imageIdsSource[currentImageIdIndexSource];

    sourceEl = element;

    // Get current element target information
    const sourceElement = element;
    const sourceEnabledElement = external.cornerstone.getEnabledElement(sourceElement);
    const sourceImageId = sourceEnabledElement.image.imageId;
    const sourceImagePlane = external.cornerstone.metaData.get('imagePlaneModule', sourceImageId);

    if (!sourceImagePlane) {
        return;
    }

    // Get currentPoints from mouse cursor on selected element
    const sourceImagePoint = eventData.currentPoints.image;

    // Transfer this to a patientPoint given imagePlane metadata
    patientPoint = imagePointToPatientPoint(sourceImagePoint, sourceImagePlane);

    // Get the enabled elements associated with this synchronization context
    const syncContext = toolData.data[0].synchronizationContext;
    const enabledElements = syncContext.getSourceElements();

    sourceElement.removeEventListener(EVENTS.IMAGE_RENDERED, this.onTriangulationRendered);

    // Iterate over each synchronized element
    enabledElements.forEach(function (targetElement, idx) {
        // Don't do anything if the target is the same as the source
        if (targetElement === sourceElement) {
        return;
        }

        targetElement.addEventListener(EVENTS.IMAGE_RENDERED, this.onTriangulationRendered);

        const toolDataTriag = getToolState(targetElement, this.name);
        if (toolDataTriag && toolDataTriag.data[0]) {
        toolDataTriag.data[0].measurementData = '';
        }

        let minDistance = Number.MAX_VALUE;
        let newImageIdIndex = -1;

        const stackToolDataSource = getToolState(targetElement, 'stack');

        if (stackToolDataSource === undefined) {
        return;
        }

        const stackData = stackToolDataSource.data[0];

        // Find within the element's stack the closest image plane to selected location
        stackData.imageIds.forEach(function (imageId, index) {
        const imagePlane = external.cornerstone.metaData.get('imagePlaneModule', imageId);

        // Skip if the image plane is not ready
        if (!imagePlane || !imagePlane.imagePositionPatient || !imagePlane.rowCosines || !imagePlane.columnCosines) {
            return;
        }

        const imagePosition = convertToVector3(imagePlane.imagePositionPatient);
        const row = convertToVector3(imagePlane.rowCosines);
        const column = convertToVector3(imagePlane.columnCosines);
        const normal = column.clone().cross(row.clone());
        const distance = Math.abs(normal.clone().dot(imagePosition) - normal.clone().dot(patientPoint));

        if (distance < minDistance) {
            minDistance = distance;
            newImageIdIndex = index;
        }
        });

        if (newImageIdIndex === stackData.currentImageIdIndex) {
        return;
        }

        // Switch the loaded image to the required image
        if (newImageIdIndex !== -1 && stackData.imageIds[newImageIdIndex] !== undefined) {
            const startLoadingHandler = loadHandlerManager.getStartLoadHandler();
            const endLoadingHandler = loadHandlerManager.getEndLoadHandler();
            const errorLoadingHandler = loadHandlerManager.getErrorLoadingHandler();

            if (startLoadingHandler) {
                startLoadingHandler(targetElement);
            }

            let loader;

            if (stackData.preventCache === true) {
                loader = external.cornerstone.loadImage(stackData.imageIds[newImageIdIndex]);
            } else {
                loader = external.cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]);
            }

            loader.then(function (image) {
                imageIdsTarget[idx] = image.imageId;
                const viewport = external.cornerstone.getViewport(targetElement);

                stackData.currentImageIdIndex = newImageIdIndex;
                external.cornerstone.displayImage(targetElement, image, viewport);
                if (endLoadingHandler) {
                endLoadingHandler(targetElement, image);
                }
            }, function (error) {
                const imageId = stackData.imageIds[newImageIdIndex];

                if (errorLoadingHandler) {
                errorLoadingHandler(targetElement, imageId, error);
                }
            });
        }
    }.bind(this));
  }

  createNewMeasurement (eventData) {
    const goodEventData = eventData && eventData.currentPoints && eventData.currentPoints.image;
  
    if (!goodEventData) {
      console.error('required eventData not supplieed to tool ' + this.name + '\'s createNewMeasurement');

      return;
    }

    const measurement =  {
      visible: true,
      active: true,
      color: "#00affc",
      handles: {
        end: {
          x: eventData.currentPoints.image.x,
          y: eventData.currentPoints.image.y,
          highlight: true,
          active: true
        }
      }
    };

    const element = eventData.element;

    // Associate this data with this imageId so we can render it and manipulate it
    const toolData = getToolState(element, this.name);
    if (toolData && toolData.data[0]) {
      toolData.data[0].measurementData = measurement;
    }

    return measurement;
  }

  renderToolData(e) {
    const eventData = e.detail;
    // If we have no toolData for this element, return immediately as there is nothing to do
    const toolData = getToolState(eventData.element, this.name);
    if (!toolData || !toolData.data[0]) {
      return;
    }
    
    // We have tool data for this element - iterate over each one and draw it
    for (let i = 0; i < toolData.data.length; i++) {

      const data = toolData.data[i].measurementData;
  
      if (data) {
        if (data.visible === false) {
          continue;
        }

        const color = toolColors.getColorIfActive(data);
        const handles = {x: data.handles.end.x, y: data.handles.end.y};
        if (eventData.image.imageId === imageIdSource) {
          this.renderCursor(eventData, handles, color);
        }
      }
    }
  }

  onTriangulationRendered(e) {
    const cornerstone = external.cornerstone;
    const eventData = e.detail;
    const image = eventData.image;
    const toolData = getToolState(sourceEl, this.name);
    if (toolData && toolData.data[0] && toolData.data[0].measurementData) {
      const imagePlaneDisplay = cornerstone.metaData.get('imagePlaneModule', image.imageId);
      const imageCoords = projectPatientPointToImagePlane(patientPoint, imagePlaneDisplay);
      if (imageIdsTarget.indexOf(image.imageId) > -1) {
        this.renderCursor(eventData, imageCoords, "#00affc");
      }      
    }
  }

  renderCursor(eventData, handles, color) {
    const context = getNewContext(eventData.canvasContext.canvas);
    const handleCanvas = external.cornerstone.pixelToCanvas(eventData.element, handles);
    const handleRadius = 1;

    const lineWidth = 2

    context.save();
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowColor = '#000000';
    context.shadowOffsetX = 0;
    context.shadowOffsetX = 0;
    context.shadowBlur = 5;
    context.moveTo(handleCanvas.x, handleCanvas.y - 10);
    context.lineTo(handleCanvas.x, handleCanvas.y - 5);
    context.moveTo(handleCanvas.x, handleCanvas.y + 10);
    context.lineTo(handleCanvas.x, handleCanvas.y + 5);

    context.moveTo(handleCanvas.x + 10, handleCanvas.y);
    context.lineTo(handleCanvas.x + 5, handleCanvas.y);
    context.moveTo(handleCanvas.x - 10, handleCanvas.y);
    context.lineTo(handleCanvas.x - 5, handleCanvas.y);
    
    context.moveTo(handleCanvas.x, handleCanvas.y);
    context.arc(handleCanvas.x, handleCanvas.y, handleRadius, 0, 2*Math.PI);
    context.stroke();
  }

  clearMeasurements(element) {
    var cornerstone = external.cornerstone;
    var toolData = getToolState(element, this.name);
    if (toolData && toolData.data[0]) {
      toolData.data[0].measurementData = '';
      var syncContext = toolData.data[0].synchronizationContext;
      var enabledElements = syncContext.getSourceElements();
      enabledElements.forEach(targetElement => {
        if (targetElement === element) {
          return;
        }
        cornerstone.updateImage(targetElement);
      });
    }
  }

  activeCallback (element, { mouseButtonMask, synchronizationContext }) {
    setToolOptions(this.name, element, { mouseButtonMask });

    // Clear any currently existing toolData
    clearToolState(element, this.name);

    addToolState(element, this.name, {
      synchronizationContext,
      measurementData: ''
    });
  }

  disabledCallback (element) {
    const toolData = getToolState(element, this.name);
    if (toolData && toolData.data[0]) {
      const syncContext = toolData.data[0].synchronizationContext;
      const enabledElements = syncContext.getSourceElements();
      enabledElements.forEach(function (targetElement) { 
        targetElement.removeEventListener(EVENTS.IMAGE_RENDERED, this.onTriangulationRendered);
      }.bind(this));
    }
  }

}
