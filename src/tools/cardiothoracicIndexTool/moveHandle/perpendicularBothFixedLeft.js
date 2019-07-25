import external from './../../../externalModules.js';

// Move long-axis start point
export default function(proposedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, perpendicularStart, perpendicularEnd, leftStart, leftEnd, rightStart, rightEnd } = data.handles;

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

  if (newLineLength <= 3) {
    return false;
  }

  const distanceFromPerpendicularP1 = distance(perpendicularStart, end);
  const distanceFromPerpendicularP2 = distance(perpendicularEnd, end);
  const newLineLength = distance(end, proposedPoint);
  const dx = (end.x - proposedPoint.x) / newLineLength;
  const dy = (end.y - proposedPoint.y) / newLineLength;

  // reposition of main perpendicular line
  perpendicularStart.x = end.x - distanceFromPerpendicularP1 * dy;
  perpendicularStart.y = end.y + distanceFromPerpendicularP1 * dx;
  perpendicularEnd.x = end.x + distanceFromPerpendicularP2 * dy;
  perpendicularEnd.y = end.y - distanceFromPerpendicularP2 * dx;

  const lineLength = distance(end, start);
  const lengthLeft = distance(end, leftEnd);
  let k = (lengthLeft / lineLength);
  const newIntersectionL = {
    x: end.x + (proposedPoint.x - end.x) * k,
    y: end.y + (proposedPoint.y - end.y) * k,
  };

  const distanceFromLeftStart = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    leftStart
  );

  // reposition of left perpendicular line
  leftStart.x = newIntersectionL.x - distanceFromLeftStart * dy;
  leftStart.y = newIntersectionL.y + distanceFromLeftStart * dx;
  leftEnd.x = newIntersectionL.x;
  leftEnd.y = newIntersectionL.y;

  const lengthRight = distance(end, rightEnd);
  k = (lengthRight / lineLength);
  const newIntersectionR = {
    x: end.x + (proposedPoint.x - end.x) * k,
    y: end.y + (proposedPoint.y - end.y) * k,
  };

  const distanceFromRightStart = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    rightStart
  );

  // reposition of left perpendicular line
  rightStart.x = newIntersectionR.x + distanceFromRightStart * dy;
  rightStart.y = newIntersectionR.y - distanceFromRightStart * dx;
  rightEnd.x = newIntersectionR.x;
  rightEnd.y = newIntersectionR.y;

  return true;
}
