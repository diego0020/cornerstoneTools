import * as cornerstone from 'cornerstone-core';
import toolStyle from '../stateManagement/toolStyle';

const handleRadius = 6;

export default function (context, renderData, handles, color, options) {
  context.strokeStyle = color;
  const radius = options.handleRadius === undefined ? handleRadius : options.handleRadius;

  Object.keys(handles).forEach(function (name) {
    const handle = handles[name];

    if (handle.drawnIndependently === true) {
      return;
    }

    if (options && options.drawHandlesIfActive === true && !handle.active) {
      return;
    }

    if (options && options.hideHandlesIfMoved === true && handle.isMoving) {
      return;
    }

    context.beginPath();

    if (handle.active) {
      context.lineWidth = toolStyle.getActiveWidth();
    } else {
      context.lineWidth = toolStyle.getToolWidth();
    }

    const handleCanvasCoords = cornerstone.pixelToCanvas(renderData.element, handle);

    context.arc(handleCanvasCoords.x, handleCanvasCoords.y, radius, 0, 2 * Math.PI);

    if (options && options.fill) {
      context.fillStyle = options.fill;
      context.fill();
    }

    context.stroke();
  });
}
