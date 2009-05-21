/**
 * Base object holding the dimensions of the represented base.
 * TODO: Research if Troop and Base should be merged.
 * @class Base
 * @param width - width
 * @param height - height
 */
var Base = function(width, height) {
  return {
    width: Convert.mm(width),
    height: Convert.mm(height)
  };
};
var base_20mm = new Base(20, 20);
var base_25mm = new Base(25, 25);
var base_cavalry = new Base(25, 50);
var base_40mm = new Base(40, 40);
var base_50mm = new Base(50, 50);
var base_chariot = new Base(50, 100);

