// Update the  perpendicular line handles
export default function(eventData, data) {
  if (!data.handles.perpendicularStart.locked) {
    return;
  }

  console.log( 'xxxxxxxxxxxxxxxxxxxxxxxxxx update perpendicular handles! ');

  let startX, startY, endX, endY;
  let leftStartX, leftStartY, leftEndX, leftEndY;

  const { start, end } = data.handles;

  if (start.x === end.x && start.y === end.y) {
    startX = start.x;
    startY = start.y;
    endX = end.x;
    endY = end.y;
    leftStartX = start.x;
    leftStartY = start.y;
    leftEndX = end.x;
    leftEndY = end.y;
  } else {
    // Mid point of long-axis line
    const mid = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };

    // Length of long-axis
    const dx = (start.x - end.x) * (eventData.image.columnPixelSpacing || 1);
    const dy = (start.y - end.y) * (eventData.image.rowPixelSpacing || 1);
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpendicularLineLength = length / 2;

    const vectorX = (start.x - end.x) / length;
    const vectorY = (start.y - end.y) / length;

    startX = end.x + (perpendicularLineLength / 2) * vectorY;
    startY = end.y - (perpendicularLineLength / 2) * vectorX;
    endX = end.x - (perpendicularLineLength / 2) * vectorY;
    endY = end.y + (perpendicularLineLength / 2) * vectorX;

    leftStartX = mid.x + (perpendicularLineLength / 2) * vectorY;
    leftStartY = mid.y - (perpendicularLineLength / 2) * vectorX;
    leftEndX = mid.x;
    leftEndY = mid.y;
  }

  // main perpendicular line
  data.handles.perpendicularStart.x = startX;
  data.handles.perpendicularStart.y = startY;
  data.handles.perpendicularEnd.x = endX;
  data.handles.perpendicularEnd.y = endY;

  // left perpendicular
  data.handles.leftStart.x = leftStartX;
  data.handles.leftStart.y = leftStartY;
  data.handles.leftEnd.x = leftEndX;
  data.handles.leftEnd.y = leftEndY;
}
