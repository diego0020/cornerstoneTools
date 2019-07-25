import external from './../../../externalModules.js';
import getSpPoint from '../utils/getSpPoint.js';

// Move perpendicular line end point
export default function(movedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, perpendicularStart, perpendicularEnd, rightStart, rightEnd } = data.handles;

  const fudgeFactor = 1;

  const fixedPoint = rightEnd;
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

  const cross = new external.cornerstoneMath.Vector3();
  const vecA = { x:end.x-start.x, y:end.y-start.y, z:0 };
  const vecB = { x:movedPoint.x-start.x, y:movedPoint.y-start.y, z:0 };
  cross.crossVectors(vecA,vecB);
  if(cross.z >= 0) {
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

  rightStart.x = movedPoint.x;
  rightStart.y = movedPoint.y;
  rightEnd.x = movedPoint.x + distanceFromMoved * dy;
  rightEnd.y = movedPoint.y - distanceFromMoved * dx;
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

  const pointInLine = getSpPoint(longLine.start,longLine.end,movedPoint);
  const lengthSp = distance(start, pointInLine);
  const lengthEp = distance(end, pointInLine);
  const intersection = length > lengthSp && length > lengthEp;

  if (!intersection) {
    if (distance(movedPoint, start) > distance(movedPoint, end)) {
      rightStart.x = adjustedLineP2.x - distanceFromMoved * dy;
      rightStart.y = adjustedLineP2.y + distanceFromMoved * dx;
      rightEnd.x = rightStart.x + total * dy;
      rightEnd.y = rightStart.y - total * dx;
    } else {
      rightStart.x = adjustedLineP1.x - distanceFromMoved * dy;
      rightStart.y = adjustedLineP1.y + distanceFromMoved * dx;
      rightEnd.x = rightStart.x + total * dy;
      rightEnd.y = rightStart.y - total * dx;
    }
  }
  return true;
}
