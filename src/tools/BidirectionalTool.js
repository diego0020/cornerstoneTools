import baseAnnotationTool from '../base/baseAnnotationTool.js';

import createNewMeasurement from './bidirectionalTool/createNewMeasurement.js';
import pointNearTool from './bidirectionalTool/pointNearTool.js';
import renderToolData from './bidirectionalTool/renderToolData.js';
import addNewMeasurement from './bidirectionalTool/addNewMeasurement.js';
import _moveCallback from './bidirectionalTool/mouseMoveCallback.js';
import handleSelectedCallback from './bidirectionalTool/handleSelectedCallback.js';
import handleSelectedMouseCallback from './bidirectionalTool/handleSelectedMouseCallback.js';
// import handleSelectedTouchCallback from './bidirectionalTool/handleSelectedTouchCallback.js';
import throttle from './../util/throttle';
import getPixelSpacing from './../util/getPixelSpacing';
import calculateLongestAndShortestDiameters from './bidirectionalTool/utils/calculateLongestAndShortestDiameters';

const emptyLocationCallback = (measurementData, eventData, doneCallback) =>
  doneCallback();

export default class extends baseAnnotationTool {
  constructor(name = 'Bidirectional') {
    const defaultProps = {
      name,
      supportedInteractionTypes: ['mouse'], 
      configuration: {
        changeMeasurementLocationCallback: emptyLocationCallback,
        getMeasurementLocationCallback: emptyLocationCallback,
        textBox: '',
        shadow: '',
        drawHandlesOnHover: true,
        additionalData: [],
      },

    };

    super(defaultProps);

    this.throttledUpdateCachedStats = throttle(this.updateCachedStats, 110);

    this.createNewMeasurement = createNewMeasurement.bind(this);
    this.pointNearTool = pointNearTool.bind(this);
    this.renderToolData = renderToolData.bind(this);
    this.addNewMeasurement = addNewMeasurement.bind(this);
    this._moveCallback = _moveCallback.bind(this);

    this.handleSelectedCallback = handleSelectedCallback.bind(this);
    this.handleSelectedMouseCallback = handleSelectedMouseCallback.bind(this);
    // this.handleSelectedTouchCallback = handleSelectedTouchCallback.bind(this);
  }

  updateCachedStats(image, element, data) {
    const pixelSpacing = getPixelSpacing(image);
    const {
      longestDiameter,
      shortestDiameter,
    } = calculateLongestAndShortestDiameters(data, pixelSpacing);

    // Set measurement text to show lesion table
    data.longestDiameter = longestDiameter;
    data.shortestDiameter = shortestDiameter;
    data.invalidated = false;
  }
}