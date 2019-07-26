import external from './../../../externalModules.js';
import getSpPoint from '../utils/getSpPoint.js';

// Move perpendicular line start point
export default function(movedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, leftStart, leftEnd, perpendicularEnd, perpendicularStart } = data.handles;

  const fudgeFactor = 1;
  const fixedPoint = leftEnd;

  const distanceFromFixed = 0;
  const distanceFromMoved = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    movedPoint
  );

  const distanceBetweenPoints = distance(fixedPoint, movedPoint);
  const total = distanceFromFixed + distanceFromMoved;

  if (distanceBetweenPoints <= distanceFromFixed) {
    return false;
  }

  const length = distance(start, end);
  if (length === 0) {
    return false;
  }

  // check that new point is on right side
  const cross = new external.cornerstoneMath.Vector3();
  const vecA = { x: end.x-start.x, y: end.y-start.y, z: 0 };
  const vecB = { x: movedPoint.x-start.x, y: movedPoint.y-start.y, z: 0 };
  cross.crossVectors(vecA,vecB);
  if (cross.z <= 0) {
    return false;
  }

  const dx = (start.x - end.x) / length;
  const dy = (start.y - end.y) / length;

  const adjustedLineP1 = {
    x: start.x - fudgeFactor * dx,
    y: start.y - fudgeFactor * dy,
  };
  const adjustedLineP2 = {
    x: end.x + fudgeFactor * dx,
    y: end.y + fudgeFactor * dy,
  };

  // proposed new position for left line
  leftStart.x = movedPoint.x;
  leftStart.y = movedPoint.y;
  leftEnd.x = movedPoint.x - distanceFromMoved * dy;
  leftEnd.y = movedPoint.y + distanceFromMoved * dx;

  // mark that handle has been modified (must be another variable?)
  perpendicularEnd.locked = false;
  perpendicularStart.locked = false;
  
  const longLine = {
    start: {
      x: start.x,
      y: start.y,
    },
    end: {
      x: end.x,
      y: end.y,
    },
  };
  
  // use projected point in vertical line to check if new point is on a
  //   valid new position
  const pointInLine = getSpPoint(longLine.start,longLine.end,movedPoint);
  const lengthSp = distance(start, pointInLine);
  const lengthEp = distance(end, pointInLine);
  const intersection = length > lengthSp && length > lengthEp;

  if (!intersection) {

    // if new point exceeds limits of vertical line, put it perpendicular to
    //     nearest vertical vertex
    if (distance(movedPoint, start) > distance(movedPoint, end)) {
      leftStart.x = adjustedLineP2.x + distanceFromMoved * dy;
      leftStart.y = adjustedLineP2.y - distanceFromMoved * dx;
      leftEnd.x = leftStart.x - total * dy;
      leftEnd.y = leftStart.y + total * dx;
    } else {
      leftStart.x = adjustedLineP1.x + distanceFromMoved * dy;
      leftStart.y = adjustedLineP1.y - distanceFromMoved * dx;
      leftEnd.x = leftStart.x - total * dy;
      leftEnd.y = leftStart.y + total * dx;
    }
  }

  return true;
}
