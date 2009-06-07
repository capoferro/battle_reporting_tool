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
  var troop_self = this;
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
   this.base.node.onabort = function(){
     switch (Globals.mode){
     default:
       Default_Events.onabort();
       }
   };
   this.base.node.onblur = function(){
     switch (Globals.mode){
     default:
       Default_Events.onblur();
       }
   };
   this.base.node.onchange = function(){
     switch (Globals.mode){
     default:
       Default_Events.onchange();
       }
   };
  this.base.node.onclick = function(){
    switch (Globals.mode){
    case Constants.mode.UNIT_SELECTED:
      if (Globals.selected == this.parent){
	troop_self.parent.unselect();
	set_mode(Constants.mode.DEFAULT);
      } else {
	Globals.selected.unselect();
	troop_self.parent.select();
      }
      break;
    case Constants.mode.UNIT_PIVOT:
      Globals.selected.pivot();
      break;
    case Constants.mode.RULER:
    default:
      troop_self.parent.select();
    }
  };
   this.base.node.ondblclick = function(){
     switch (Globals.mode){
     default:
       Default_Events.ondblclick();
       }
   };
   this.base.node.onerror = function(){
     switch (Globals.mode){
     default:
       Default_Events.onerror();
       }
   };
   this.base.node.onfocus = function(){
     switch (Globals.mode){
     default:
       Default_Events.onfocus();
       }
   };
   this.base.node.onkeydown = function(){
     switch (Globals.mode){
     default:
       Default_Events.onkeydown();
       }
   };
   this.base.node.onkeypress = function(){
     switch (Globals.mode){
     default:
       Default_Events.onkeypress();
       }
   };
   this.base.node.onkeyup = function(){
     switch (Globals.mode){
     default:
       Default_Events.onkeyup();
       }
   };
   this.base.node.onload = function(){
     switch (Globals.mode){
     default:
       Default_Events.onload();
       }
   };
   this.base.node.onmousedown = function(){
     switch (Globals.mode){
     default:
       Default_Events.onmousedown();
       }
   };
  this.base.node.onmousemove = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmousemove();
    }
  };
   this.base.node.onmouseout = function(){
     switch (Globals.mode){
     default:
       Default_Events.onmouseout();
       }
   };
   this.base.node.onmouseover = function(){
     switch (Globals.mode){
     default:
       Default_Events.onmouseover();
       }
   };
   this.base.node.onmouseup = function(){
     switch (Globals.mode){
     default:
       Default_Events.onmouseup();
       }
   };
   this.base.node.onreset = function(){
     switch (Globals.mode){
     default:
       Default_Events.onreset();
       }
   };
   this.base.node.onresize = function(){
     switch (Globals.mode){
     default:
       Default_Events.onresize();
       }
   };
   this.base.node.onselect = function(){
     switch (Globals.mode){
     default:
       Default_Events.onselect();
       }
   };
   this.base.node.onsubmit = function(){
     switch (Globals.mode){
     default:
       Default_Events.onsubmit();
       }
   };
   this.base.node.onunload = function(){
     switch (Globals.mode){
     default:
       Default_Events.onunload();
       }
   };
}