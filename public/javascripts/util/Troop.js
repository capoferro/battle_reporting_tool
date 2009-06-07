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

  generate_event_template(this.base.node);
  this.base.node.onclick = function(){
    switch (Mode.peek()){
    case Constants.mode.UNIT_SELECTED:
      if (Globals.selected === troop_self.parent){
	troop_self.parent.unselect();
	Mode.pop();
      } else {
	Globals.selected.unselect();
	troop_self.parent.select();
      }
      break;
    case Constants.mode.UNIT_PIVOT:
      Globals.selected.pivot();
      break;
    case Constants.mode.DEFAULT:
      troop_self.parent.select();
      Mode.push(Constants.mode.UNIT_SELECTED);
      break;
    default:
      Default_Events.onclick();
    }
  };
  // this.base.node.onmousedown = function(){
  //   switch (Mode.peek()){
  //   case Constants.mode.UNIT_SELECTED:
  //     if (this.parent == Globals.selected) {
  // 	this.parent.teleport.init();
  // 	Mode.push(Constants.mode.TELEPORT);
  //     }
  //   default:
  //     Default_Events.onmousedown();
  //   }
  // };
  // this.base.node.onmouseup = function(){
  //   switch (Mode.peek()){
  //   case Constants.mode.TELEPORT:
  //     Mode.push(Constants.mode.UNIT_SELECTED);
  //   default:
  //     Default_Events.onmouseup();
  //   }
  // };
}