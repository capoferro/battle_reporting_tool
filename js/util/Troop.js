/**
 * Represents an individual model on the board.
 * @class Troop
 * @param config {JSON} - config object
 * @cfg x {int} - x coordinate of top left corner of base
 * @cfg y {int} - y coordinate of top left corner of base
 * @cfg base {Base} - base object
 * @cfg fill_color {string} - fill color
 */
function Troop(config) {
  this.x = config.x;
  this.y = config.y;
  this.fill_color = (config.fill_color.charAt(0) == '#')?config.fill_color:('#'+config.fill_color);
  this.selected = config.selected;
  this.stroke_color = '#000';

  if (Globals.paper !== undefined) {
    this.base = Globals.paper.rect(this.x,
			   this.y,
			   config.base.width-1,
			   config.base.height-1);
  } else {
    throw new Error('paper is undefined');
  }
  this.base.attr({stroke: this.stroke_color,
		  'stroke-opacity': (this.selected)?.5:1,
		  fill: this.fill_color});
}