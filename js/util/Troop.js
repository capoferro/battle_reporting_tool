/**
 * Represents an individual model on the board.
 * @class Troop
 * @param config {JSON} - config object
 * @cfg x {int} - x coordinate of top left corner of base
 * @cfg y {int} - y coordinate of top left corner of base
 * @cfg base {Base} - base object
 * @cfg fill_color {string} - fill color
 * @param paper {Raphael} - rendering target
 */
function Troop(config, paper) {
  this.x = config.x;
  this.y = config.y;
  this.fill_color = config.fill_color;
  this.base = paper.rect(this.x,
			 this.y,
			 config.base.width-1,
			 config.base.height-1);
  this.base.attr({stroke: 'black',
		  fill: this.fill_color});
}