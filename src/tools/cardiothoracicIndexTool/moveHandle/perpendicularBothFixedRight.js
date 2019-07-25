import external from './../../../externalModules.js';

// Move long-axis end point
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

  const newLineLength = distance(start, proposedPoint);
  const distanceFromPerpendicularP1 = distance(perpendicularStart, end);
  const distanceFromPerpendicularP2 = distance(perpendicularEnd, end);

  if (newLineLength <= 3) {
    return false;
  }

  const dx = (start.x - proposedPoint.x) / newLineLength;
  const dy = (start.y - proposedPoint.y) / newLineLength;

  // reposition of main perpendicular line
  perpendicularStart.x = proposedPoint.x + distanceFromPerpendicularP1 * dy;
  perpendicularStart.y = proposedPoint.y - distanceFromPerpendicularP1 * dx;
  perpendicularEnd.x = proposedPoint.x - distanceFromPerpendicularP2 * dy;
  perpendicularEnd.y = proposedPoint.y + distanceFromPerpendicularP2 * dx;

  const distanceFromLeftStart = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    leftStart
  );

  const lineLength = distance(start, end);
  const lengthLeft = distance(start, leftEnd);

  let k = (lengthLeft / lineLength);
  const newIntersectionL = {
    x: start.x + (proposedPoint.x - start.x) * k,
    y: start.y + (proposedPoint.y - start.y) * k,
  };  

  // reposition of left perpendicular line
  leftStart.x = newIntersectionL.x + distanceFromLeftStart * dy;
  leftStart.y = newIntersectionL.y - distanceFromLeftStart * dx;
  leftEnd.x = newIntersectionL.x;
  leftEnd.y = newIntersectionL.y;


  const distanceFromRightStart = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    rightStart
  );

  const lengthRight = distance(start, rightEnd);

  k = (lengthRight / lineLength);
  const newIntersectionR = {
    x: start.x + (proposedPoint.x - start.x) * k,
    y: start.y + (proposedPoint.y - start.y) * k,
  };  

  // reposition of right perpendicular line
  rightStart.x = newIntersectionR.x - distanceFromRightStart * dy;
  rightStart.y = newIntersectionR.y + distanceFromRightStart * dx;
  rightEnd.x = newIntersectionR.x;
  rightEnd.y = newIntersectionR.y;

  return true;
}
