/**
 * Calculates point on line that is perpendicular to given point
 * @param lineStart
 * @param lineEnd
 * @param point
 */
export default function calculateLongestAndShortestDiameters(
  lineStart,
  lineEnd,
  point
) {
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
