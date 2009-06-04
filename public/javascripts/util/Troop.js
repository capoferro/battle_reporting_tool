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
  var self = this;
  this.parent = config.parent;
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
		  'fill-opacity': (this.selected)?.75:1,
		  'stroke-opacity': (this.selected)?.75:1,
		  fill: this.fill_color});
  // this.base.node.onabort = function(){};
  // this.base.node.onblur = function(){};
  // this.base.node.onchange = function(){};
  this.base.node.onclick = function(){
    switch (Globals.mode){
    case Constants.mode.UNIT_SELECTED:
      if (Globals.selected == this.parent){
	self.parent.unselect();
	alert('boom');
	set_mode(Constants.mode.DEFAULT);
      } else{
	Globals.selected.unselect();
	self.parent.select();
      }
      break;
    case Constants.mode.UNIT_PIVOT:
      Globals.selected.pivot();
      break;
    case Constants.mode.RULER:
      Ruler.toggle(false);
      set_mode(Constants.mode.DEFAULT);
      break;
    default:
      self.parent.select();
    }
  };
  // this.base.node.ondblclick = function(){};
  // this.base.node.onerror = function(){};
  // this.base.node.onfocus = function(){};
  // this.base.node.onkeydown = function(){};
  // this.base.node.onkeypress = function(){};
  // this.base.node.onkeyup = function(){};
  // this.base.node.onload = function(){};
  // this.base.node.onmousedown = function(){};
  this.base.node.onmousemove = function(){
    switch (Globals.mode){
    case Constants.mode.RULER:
      Ruler.draw();
      break;
    }
  };
  // this.base.node.onmouseout = function(){};
  // this.base.node.onmouseover = function(){};
  // this.base.node.onmouseup = function(){};
  // this.base.node.onreset = function(){};
  // this.base.node.onresize = function(){};
  // this.base.node.onselect = function(){};
  // this.base.node.onsubmit = function(){};
  // this.base.node.onunload = function(){};
}