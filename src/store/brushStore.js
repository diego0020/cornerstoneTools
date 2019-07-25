import external from '../externalModules.js';

const state = {
  draw: 1,
  radius: 10,
  minRadius: 1,
  maxRadius: 50,
  alpha: 0.4,
  colorMapId: 'BrushColorMap'
};

const mutations = {
  SET_DRAW_COLOR: (drawColorId) => {
    state.draw = drawColorId;
  },
  SET_RADIUS: (radius) => {
    state.radius = Math.min(
      Math.max(radius, state.minRadius),
      state.maxRadius
    );
  },
  SET_MIN_RADIUS: (minRadius) => {
    state.minRadius = minRadius;
  },
  SET_MAX_RADIUS: (maxRadius) => {
    state.maxRadius = maxRadius;
  },
  SET_ALPHA: (alpha) => {
    state.alpha = alpha;
  },

  /**
   * Sets the brush color map to something other than the default
   *
   * @param  {Array} colors An array of 4D [red, green, blue, alpha] arrays.
   */
  SET_BRUSH_COLOR_MAP: (colors) => {
    const colormap = external.cornerstone.colors.getColormap(state.colorMapId);

    colormap.setNumberOfColors(colors.length);

    for (let i = 0; i < colors.length; i++) {
      colormap.setColor(i, colors[i]);
    }
  }
};

const getters = {
  draw: () => state.draw,
  radius: () => state.radius,
  minRadius: () => state.minRadius,
  maxRadius: () => state.maxRadius,
  alpha: () => state.alpha,
  colorMapId: () => state.colorMapId
};

export default {
  state,
  getters,
  mutations
};


// DEFAULT BRUSH COLOR MAP
// const colormap = external.cornerstone.colors.getColormap(state.colorMapId);

// colormap.setNumberOfColors(20);
// colormap.setColor(0, [255, 255, 255, 0]);
// colormap.setColor(1, [230, 25, 75, 255]);
// colormap.setColor(2, [60, 180, 175, 255]);
// colormap.setColor(3, [255, 225, 25, 255]);
// colormap.setColor(4, [0, 130, 200, 255]);
// colormap.setColor(5, [245, 130, 48, 255]);
// colormap.setColor(6, [145, 30, 180, 255]);
// colormap.setColor(7, [70, 240, 240, 255]);
// colormap.setColor(8, [240, 50, 230, 255]);
// colormap.setColor(9, [210, 245, 60, 255]);
// colormap.setColor(10, [250, 190, 190, 255]);
// colormap.setColor(11, [0, 128, 128, 255]);
// colormap.setColor(12, [230, 190, 255, 255]);
// colormap.setColor(13, [170, 110, 40, 255]);
// colormap.setColor(14, [255, 250, 200, 255]);
// colormap.setColor(15, [128, 0, 0, 255]);
// colormap.setColor(16, [170, 255, 195, 255]);
// colormap.setColor(17, [128, 128, 0, 255]);
// colormap.setColor(18, [255, 215, 180, 255]);
// colormap.setColor(19, [0, 0, 128, 255]);