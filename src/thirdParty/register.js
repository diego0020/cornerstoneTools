import registerModule from './registerModule.js';
import registerMixin from './registerMixin.js';
import registerItem from './registerItem.js';

/**
 * Register an item or module to cornerstoneTools.
 * @export @public @method
 * @name register
 *
 * @param {string} type The type of the item/module.
 * @param {string} name The name of the item/module.
 * @param {Object|function} item The item/module itself.
 * @param {boolean} [overwrite=false] Whether an item/module should be
 *                                    overwritten, should it have the same name.
 */
export default function (type, name, item, overwrite = false) {
  if (!isValidInput(type, name, item)) {
    return;
  }

  switch (type) {
    case 'module':
      registerModule(name, item, overwrite);
      break;
    case 'mixin':
      registerMixin(name, item, overwrite);
      break;
    default:
      registerItem(type, name, item, overwrite);
      console.warn(`unrecognised type ${type}, not registering ${name}`);
  }
}


/**
 * Returns true if the item is valid, this avoids
 * clogging up the library with invalid data.
 * @private @method
 * @name isValidInput
 *
 * @param {string} type The type of the item/module.
 * @param {string} name The name of the item/module.
 * @param {Object|function} item The item/module itself.
 * @return {boolean}    Whether the input is valid.
 */
function isValidInput (type, name, item) {
  if (!type) {
    console.warn(`The type must be given in order to register.`);

    return false;
  }

  if (!name) {
    console.warn(`The ${type} must have a name in order to register.`);

    return false;
  }

  if (typeof item !== 'object' && typeof item !== 'function') {
    console.warn(`The ${item} is a ${typeof item}, it should be an Object or a function.`);
    return false;
  }

  return true;
}
