import external from './../../../externalModules.js';
import perpendicularBothFixedLeft from './perpendicularBothFixedLeft.js';
import perpendicularBothFixedRight from './perpendicularBothFixedRight.js';
import perpendicularLeftFixedPoint from './perpendicularLeftFixedPoint.js';
import perpendicularLeftFixedEndPoint from './perpendicularLeftFixedEndPoint.js';
import perpendicularRightFixedPoint from './perpendicularRightFixedPoint.js';
import perpendicularRightFixedEndPoint from './perpendicularRightFixedEndPoint.js';

// Sets position of handles(start, end, perpendicularStart, perpendicularEnd)
export default function(handle, eventData, data, distanceFromTool) {
  let movedPoint;
  let outOfBounds;
  let result;
  let intersection;
  let d1;
  let d2;

  const longLine = {};
  const perpendicularLine = {};
  const leftLine = {};
  const proposedPoint = {
    x: eventData.currentPoints.image.x + distanceFromTool.x,
    y: eventData.currentPoints.image.y + distanceFromTool.y,
  };

  if (handle.index === 0) {
    // If long-axis start point is moved
    result = perpendicularBothFixedLeft(proposedPoint, data);
    if (result) {
      handle.x = proposedPoint.x;
      handle.y = proposedPoint.y;
    } else {
      eventData.currentPoints.image.x = handle.x;
      eventData.currentPoints.image.y = handle.y;
    }
    
  } else if (handle.index === 1) {
    // If long-axis end point is moved
    result = perpendicularBothFixedRight(proposedPoint, data);
    if (result) {
      handle.x = proposedPoint.x;
      handle.y = proposedPoint.y;
    } else {
      eventData.currentPoints.image.x = handle.x;
      eventData.currentPoints.image.y = handle.y;
    }

  } else if (handle.index === 2) {

    perpendicularLine.start = {
      x: data.handles.perpendicularEnd.x,
      y: data.handles.perpendicularEnd.y,
    };
    perpendicularLine.end = {
      x: proposedPoint.x,
      y: proposedPoint.y,
    };

    movedPoint = perpendicularLeftFixedEndPoint(proposedPoint, data);
    if (!movedPoint) {
      eventData.currentPoints.image.x = data.handles.perpendicularStart.x;
      eventData.currentPoints.image.y = data.handles.perpendicularStart.y;
    }

  } else if (handle.index === 3) {

    perpendicularLine.start = {
      x: data.handles.perpendicularStart.x,
      y: data.handles.perpendicularStart.y,
    };
    perpendicularLine.end = {
      x: proposedPoint.x,
      y: proposedPoint.y,
    };

    movedPoint = perpendicularRightFixedEndPoint(proposedPoint, data);
    if (!movedPoint) {
      eventData.currentPoints.image.x = data.handles.perpendicularEnd.x;
      eventData.currentPoints.image.y = data.handles.perpendicularEnd.y;
    }

  } else if (handle.index === 4) {
    movedPoint = perpendicularLeftFixedPoint(proposedPoint, data);
    if (!movedPoint) {
      eventData.currentPoints.image.x = data.handles.leftStart.x;
      eventData.currentPoints.image.y = data.handles.leftStart.y;
    }

  } else if (handle.index === 6) {
    movedPoint = perpendicularRightFixedPoint(proposedPoint, data);
    if (!movedPoint) {
      eventData.currentPoints.image.x = data.handles.rightStart.x;
      eventData.currentPoints.image.y = data.handles.rightStart.y;
    }
  } 
}
