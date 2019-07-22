import external from './../../../externalModules.js';


function getSpPoint(lineStart,lineEnd,point) {
  const x1 = lineStart.x;
  const y1 = lineStart.y;
  const x2 = lineEnd.x;
  const y2 = lineEnd.y;
  const x3 = point.x;
  const y3 = point.y;
  var px = x2-x1, py = y2-y1, dAB = px*px + py*py;
  var u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
  var x = x1 + u * px, y = y1 + u * py;
  return {x:x, y:y}; 
}

// Move perpendicular line start point
export default function(movedPoint, data) {
  const { distance } = external.cornerstoneMath.point;
  const { start, end, leftStart, leftEnd, perpendicularEnd, perpendicularStart } = data.handles;

  const fudgeFactor = 1;
  const fixedPoint = leftEnd;

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

  leftStart.x = movedPoint.x;
  leftStart.y = movedPoint.y;
  leftEnd.x = movedPoint.x - distanceFromMoved * dy;
  leftEnd.y = movedPoint.y + distanceFromMoved * dx;
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

  // const perpendicularLine = {
  //   start: {
  //     x: leftStart.x,
  //     y: leftStart.y,
  //   },
  //   end: {
  //     x: leftEnd.x,
  //     y: leftEnd.y,
  //   },
  // };

  // const intersection = external.cornerstoneMath.lineSegment.intersectLine(
  //   longLine,
  //   perpendicularLine
  // );

  const pointInLine = getSpPoint(longLine.start,longLine.end,movedPoint);
  const lengthSp = distance(start, pointInLine);
  const lengthEp = distance(end, pointInLine);
  const intersection = length > lengthSp && length > lengthEp;

  console.log('xxxxxxxxxxxxxxxxxxxxxxxx length', length);
  console.log('xxxxxxxxxxxxxxxxxxxxxxxx length sp', lengthSp);
  console.log('xxxxxxxxxxxxxxxxxxxxxxxx length ep', lengthEp);
  if (!intersection) {
    if (distance(movedPoint, start) > distance(movedPoint, end)) {
      console.log('xxxxxxxxxxxxxxxxxxxxx fixed adjustedLineP2: ', adjustedLineP2);
      leftStart.x = adjustedLineP2.x + distanceFromMoved * dy;
      leftStart.y = adjustedLineP2.y - distanceFromMoved * dx;
      leftEnd.x = leftStart.x - total * dy;
      leftEnd.y = leftStart.y + total * dx;
    } else {
      console.log('xxxxxxxxxxxxxxxxxxxxx fixed adjustedLineP1: ', adjustedLineP2);
      leftStart.x = adjustedLineP1.x + distanceFromMoved * dy;
      leftStart.y = adjustedLineP1.y - distanceFromMoved * dx;
      leftEnd.x = leftStart.x - total * dy;
      leftEnd.y = leftStart.y + total * dx;
    }
  }

  return true;
}
