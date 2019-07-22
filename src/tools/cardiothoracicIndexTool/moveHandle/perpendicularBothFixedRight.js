import external from './../../../externalModules.js';

// Move long-axis end point
export default function(proposedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, perpendicularStart, perpendicularEnd, leftStart, leftEnd } = data.handles;

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

  // const intersection = external.cornerstoneMath.lineSegment.intersectLine(
  //   longLine,
  //   perpendicularLine
  // );

  // const distanceFromPerpendicularP1 = distance(
  //   perpendicularStart,
  //   intersection
  // );
  // const distanceFromPerpendicularP2 = distance(perpendicularEnd, intersection);

  // const distanceToLineP2 = distance(start, intersection);
  // const newLineLength = distance(start, proposedPoint);

  const newLineLength = distance(start, proposedPoint);
  const distanceFromPerpendicularP1 = distance(perpendicularStart, end);
  const distanceFromPerpendicularP2 = distance(perpendicularEnd, end);

  // if (newLineLength <= distanceToLineP2) {
  //   return false;
  // }

  const dx = (start.x - proposedPoint.x) / newLineLength;
  const dy = (start.y - proposedPoint.y) / newLineLength;

  // const k = distanceToLineP2 / newLineLength;
  // const newIntersection = {
  //   x: start.x + (proposedPoint.x - start.x) * k,
  //   y: start.y + (proposedPoint.y - start.y) * k,
  // };

  // reposition of main perpendicular line
  perpendicularStart.x = proposedPoint.x + distanceFromPerpendicularP1 * dy;
  perpendicularStart.y = proposedPoint.y - distanceFromPerpendicularP1 * dx;
  perpendicularEnd.x = proposedPoint.x - distanceFromPerpendicularP2 * dy;
  perpendicularEnd.y = proposedPoint.y + distanceFromPerpendicularP2 * dx;

  // perpendicularStart.x = newIntersection.x + distanceFromPerpendicularP1 * dy;
  // perpendicularStart.y = newIntersection.y - distanceFromPerpendicularP1 * dx;
  // perpendicularEnd.x = newIntersection.x - distanceFromPerpendicularP2 * dy;
  // perpendicularEnd.y = newIntersection.y + distanceFromPerpendicularP2 * dx;

  const distanceFromLeftStart = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    leftStart
  );
  const distanceFromLeftEnd = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    leftEnd
  );

  const lineLength = distance(start, end);
  const lengthLeft = distance(start, leftEnd);

  const k = (lengthLeft / lineLength) * newLineLength;
  const newIntersection = {
    x: start.x + (proposedPoint.x - start.x) * k,
    y: start.y + (proposedPoint.y - start.y) * k,
  };  

  // reposition of left perpendicular line
  leftStart.x = newIntersection.x + distanceFromLeftStart * dy;
  leftStart.y = newIntersection.y - distanceFromLeftStart * dx;
  leftEnd.x = newIntersection.x - distanceFromLeftEnd * dy;
  leftEnd.y = newIntersection.y + distanceFromLeftEnd * dx;

  return true;
}
