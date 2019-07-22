import external from './../../../externalModules.js';
import perpendicularBothFixedLeft from './perpendicularBothFixedLeft.js';
import perpendicularBothFixedRight from './perpendicularBothFixedRight.js';
import perpendicularLeftFixedPoint from './perpendicularLeftFixedPoint.js';
import perpendicularLeftFixedEndPoint from './perpendicularLeftFixedEndPoint.js';
// import perpendicularRightFixedPoint from './perpendicularRightFixedPoint.js';
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

  console.log('xxxxxxxxxxxxxx proposedPoint', proposedPoint);
  console.log('xxxxxxxxxxxxxx distanceFromTool', distanceFromTool);

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
    outOfBounds = false;
    // If perpendicular start point is moved
    longLine.start = {
      x: data.handles.start.x,
      y: data.handles.start.y,
    };
    longLine.end = {
      x: data.handles.end.x,
      y: data.handles.end.y,
    };

    console.log('xxxxxxxxxxxxxx index 2 - proposedPoint', proposedPoint);
    perpendicularLine.start = {
      x: data.handles.perpendicularEnd.x,
      y: data.handles.perpendicularEnd.y,
    };
    perpendicularLine.end = {
      x: proposedPoint.x,
      y: proposedPoint.y,
    };
    console.log('xxxxxxxxxxxxxx index 2 - perpendicularLine', perpendicularLine);

    intersection = external.cornerstoneMath.lineSegment.intersectLine(
      longLine,
      perpendicularLine
    );
    console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - data.handles: ', data.handles);
    console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - longLine: ', longLine);
    console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - perpendicularLine: ', perpendicularLine);
    console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - intersection: ', intersection);
    // if (!intersection) {
    //   perpendicularLine.end = {
    //     x: data.handles.perpendicularStart.x,
    //     y: data.handles.perpendicularStart.y,
    //   };

    //   intersection = external.cornerstoneMath.lineSegment.intersectLine(
    //     longLine,
    //     perpendicularLine
    //   );
    //   console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - intersection2: ', intersection);
    //   d1 = external.cornerstoneMath.point.distance(
    //     intersection,
    //     data.handles.start
    //   );
    //   d2 = external.cornerstoneMath.point.distance(
    //     intersection,
    //     data.handles.end
    //   );

    //   console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - intersection - d1: ', d1);
    //   console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - intersection - d2: ', d2);

    //   if (!intersection || d1 < 3 || d2 < 3) {
    //     outOfBounds = true;
    //   }
    // }

    movedPoint = false;

    if (!outOfBounds) {
      movedPoint = perpendicularLeftFixedEndPoint(proposedPoint, data);
      console.log('xxxxxxxxxxxxxxxxxxx handle index 2 - movedPoint: ', data.handles);
      if (!movedPoint) {
        eventData.currentPoints.image.x = data.handles.perpendicularStart.x;
        eventData.currentPoints.image.y = data.handles.perpendicularStart.y;
      }
    }
  } else if (handle.index === 3) {
    outOfBounds = false;

    // If perpendicular end point is moved
    longLine.start = {
      x: data.handles.start.x,
      y: data.handles.start.y,
    };
    longLine.end = {
      x: data.handles.end.x,
      y: data.handles.end.y,
    };

    perpendicularLine.start = {
      x: data.handles.perpendicularStart.x,
      y: data.handles.perpendicularStart.y,
    };
    perpendicularLine.end = {
      x: proposedPoint.x,
      y: proposedPoint.y,
    };

    intersection = external.cornerstoneMath.lineSegment.intersectLine(
      longLine,
      perpendicularLine
    );
    // if (!intersection) {
    //   perpendicularLine.end = {
    //     x: data.handles.perpendicularEnd.x,
    //     y: data.handles.perpendicularEnd.y,
    //   };

    //   intersection = external.cornerstoneMath.lineSegment.intersectLine(
    //     longLine,
    //     perpendicularLine
    //   );

    //   d1 = external.cornerstoneMath.point.distance(
    //     intersection,
    //     data.handles.start
    //   );
    //   d2 = external.cornerstoneMath.point.distance(
    //     intersection,
    //     data.handles.end
    //   );

    //   if (!intersection || d1 < 3 || d2 < 3) {
    //     outOfBounds = true;
    //   }
    // }

    movedPoint = false;

    if (!outOfBounds) {
      movedPoint = perpendicularRightFixedEndPoint(proposedPoint, data);

      if (!movedPoint) {
        eventData.currentPoints.image.x = data.handles.perpendicularEnd.x;
        eventData.currentPoints.image.y = data.handles.perpendicularEnd.y;
      }
    }
  } else if (handle.index === 4) {
    outOfBounds = false;
    movedPoint = false;

    if (!outOfBounds) {
      movedPoint = perpendicularLeftFixedPoint(proposedPoint, data);
      if (!movedPoint) {
        eventData.currentPoints.image.x = data.handles.leftStart.x;
        eventData.currentPoints.image.y = data.handles.leftStart.y;
      }
    }
  } 
}
