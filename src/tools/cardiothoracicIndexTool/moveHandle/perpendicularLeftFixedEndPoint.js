import external from './../../../externalModules.js';

// Move perpendicular line start point
export default function(movedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, perpendicularStart, perpendicularEnd } = data.handles;

  const fudgeFactor = 1;
  const fixedPoint = perpendicularEnd;

  console.log('xxxxxxxxxxxxxxxxxxxxxx leftFixed', data.handles);
  const distanceFromFixed = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    fixedPoint
  );
  const distanceFromMoved = external.cornerstoneMath.lineSegment.distanceToPoint(
    data.handles,
    movedPoint
  );
  console.log('xxxxxxxxxxxxxxxxxxxxxx distanceFromFixed', distanceFromFixed);
  console.log('xxxxxxxxxxxxxxxxxxxxxx distanceFromMoved', distanceFromMoved);

  const distanceBetweenPoints = distance(fixedPoint, movedPoint);
  console.log('xxxxxxxxxxxxxxxxxxxxxx distanceBetweenPoints', distanceBetweenPoints);

  const total = distanceFromFixed + distanceFromMoved;

  if (distanceBetweenPoints <= distanceFromFixed) {
    return false;
  }

  const length = distance(start, end);
  console.log('xxxxxxxxxxxxxxxxxxxxxx length', length);  

  if (length === 0) {
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

  perpendicularStart.x = adjustedLineP2.x + distanceFromMoved * dy;
  perpendicularStart.y = adjustedLineP2.y - distanceFromMoved * dx;
  perpendicularEnd.x = perpendicularStart.x - total * dy;
  perpendicularEnd.y = perpendicularStart.y + total * dx;
  perpendicularEnd.locked = false;
  perpendicularStart.locked = false;

  /*
  perpendicularStart.x = movedPoint.x;
  perpendicularStart.y = movedPoint.y;
  perpendicularEnd.x = movedPoint.x - distanceFromMoved * dy;
  perpendicularEnd.y = movedPoint.y + distanceFromMoved * dx;
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

  console.log('xxxxxxxxxxxxxxxxxxxxx fixed perpendicularLine: ', perpendicularLine);
  console.log('xxxxxxxxxxxxxxxxxxxxx intersection: ', intersection);
  if (!intersection) {
    if (distance(movedPoint, start) > distance(movedPoint, end)) {
      console.log('xxxxxxxxxxxxxxxxxxxxx fixed adjustedLineP2: ', adjustedLineP2);
      perpendicularStart.x = adjustedLineP2.x + distanceFromMoved * dy;
      perpendicularStart.y = adjustedLineP2.y - distanceFromMoved * dx;
      perpendicularEnd.x = perpendicularStart.x - total * dy;
      perpendicularEnd.y = perpendicularStart.y + total * dx;
    } else {
      console.log('xxxxxxxxxxxxxxxxxxxxx fixed adjustedLineP1: ', adjustedLineP2);
      perpendicularStart.x = adjustedLineP1.x + distanceFromMoved * dy;
      perpendicularStart.y = adjustedLineP1.y - distanceFromMoved * dx;
      perpendicularEnd.x = perpendicularStart.x - total * dy;
      perpendicularEnd.y = perpendicularStart.y + total * dx;
    }
    console.log('xxxxxxxxxxxxxxxxxxxxx fixed perpendicularStart: ', perpendicularStart);
    console.log('xxxxxxxxxxxxxxxxxxxxx fixed perpendicularEnd: ', perpendicularStart);
  }
  */

  return true;
}
