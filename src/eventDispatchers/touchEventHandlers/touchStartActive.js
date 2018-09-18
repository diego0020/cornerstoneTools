// State
import { getters, state } from './../../store/index.js';
import getActiveToolsForElement from './../../store/getActiveToolsForElement.js';
import addNewMeasurement from './addNewMeasurement.js';
import baseAnnotationTool from '../../base/baseAnnotationTool.js';

export default function (evt) {
  if (state.isToolLocked) {
    return;
  }

  const element = evt.detail.element;
  let tools = getActiveToolsForElement(element, getters.touchTools());

  tools = tools.filter(
    (tool) => tool.options.mouseButtonMask === 1
  );

  if (tools.length === 0) {
    return;
  }
  
  const activeTool = tools[0];

  // Note: custom `addNewMeasurement` will need to prevent event bubbling
  if (activeTool && activeTool.addNewMeasurement) {
    activeTool.addNewMeasurement(evt, 'touch');
  } else if (activeTool instanceof baseAnnotationTool) {
    addNewMeasurement(evt, activeTool);
  }
}
