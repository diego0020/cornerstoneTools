import external from './../../../externalModules.js';

// Move perpendicular line start point
export default function(movedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, perpendicularStart, perpendicularEnd } = data.handles;

  const fudgeFactor = 1;
  const fixedPoint = perpendicularEnd;

  const distanceFromFixed = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    fixedPoint
  );
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

  perpendicularStart.x = movedPoint.x;
  perpendicularStart.y = movedPoint.y;
  perpendicularEnd.x = movedPoint.x - total * dy;
  perpendicularEnd.y = movedPoint.y + total * dx;
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

  const perpendicularLine = {
    start: {
      x: perpendicularStart.x,
      y: perpendicularStart.y,
    },
    end: {
      x: perpendicularEnd.x,
      y: perpendicularEnd.y,
    },
  };

  const intersection = external.cornerstoneMath.lineSegment.intersectLine(
    longLine,
    perpendicularLine
  );

  if (!intersection) {
    if (distance(movedPoint, start) > distance(movedPoint, end)) {
      perpendicularStart.x = adjustedLineP2.x + distanceFromMoved * dy;
      perpendicularStart.y = adjustedLineP2.y - distanceFromMoved * dx;
      perpendicularEnd.x = perpendicularStart.x - total * dy;
      perpendicularEnd.y = perpendicularStart.y + total * dx;
    } else {
      perpendicularStart.x = adjustedLineP1.x + distanceFromMoved * dy;
      perpendicularStart.y = adjustedLineP1.y - distanceFromMoved * dx;
      perpendicularEnd.x = perpendicularStart.x - total * dy;
      perpendicularEnd.y = perpendicularStart.y + total * dx;
    }
  }

  return true;
}
