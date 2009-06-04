/**
 * Render a field with the given size on the paper.
 * @class Field
 * @param config - Config object
 * @cfg width - Width of field, in feet
 * @cfg height - Height of field, in feet
 * @cfg x - x coord of field
 * @cfg y - y coord of field
 * @cfg border - width of border on field
 * @cfg fill_color - background color
 * @param paper - Rendering target
 * TODO: document member vars
 */
var Field = function(config) {

  this.width = Convert.foot(config.width) + config.stroke_width*2;
  this.height = Convert.foot(config.height) + config.stroke_width*2;
  this.x = config.x;
  this.y = config.y;
  this.field = Globals.paper.rect(this.x,
				  this.y,
				  this.width,
				  this.height);
  this.field.attr({stroke: config.stroke,
		   'stroke-width': config.stroke_width,
		   fill: config.fill_color
		  });





   // Generate top border px markers
   var marker = undefined;
   for (var i = 10; i <= 730; i += 10){
     marker = Globals.paper.text(i, 10, ((i-10)%100)/10);
     marker.attr("fill", "black");
     if (i <= 490) {
       marker = Globals.paper.text(10, i, ((i-10)%100)/10);
       marker.attr("fill", "black");
     }
   }

  // this.field.node.onabort = function(){};
  // this.field.node.onblur = function(){};
  // this.field.node.onchange = function(){};
  this.field.node.onclick = function(){
    switch (Globals.mode) {
    case Constants.mode.CREATE_UNIT:
      Globals.queued_unit.x = Globals.mouse.x;
      Globals.queued_unit.y = Globals.mouse.y;
      var last_unit = new Unit(Globals.queued_unit);
      Globals.queued_unit = undefined;
      Globals.selected = last_unit;
      set_mode(Constants.mode.DEFAULT);
      break;
    case Constants.mode.RULER:
      Ruler.toggle(false);
      set_mode(Constants.mode.DEFAULT);
      break;
    default:
      Ruler.toggle(true);
      set_mode(Constants.mode.RULER);
    }
  };
  // this.field.node.ondblclick = function(){};
  // this.field.node.onerror = function(){};
  // this.field.node.onfocus = function(){};
  // this.field.node.onkeydown = function(){};
  // this.field.node.onkeypress = function(){};
  // this.field.node.onkeyup = function(){};
  // this.field.node.onload = function(){};
  // this.field.node.onmousedown = function(){};
  this.field.node.onmousemove = function(){
  // This should always be the same as the Ruler onmove.
    switch(Globals.mode){
    case Constants.mode.RULER:
      Ruler.draw();
      break;
    case Constants.mode.UNIT_PIVOT:
      Globals.selected.pivot();
      break;
    default:
      break;
    }
  };
  // this.field.node.onmouseout = function(){};
  // this.field.node.onmouseover = function(){};
  // this.field.node.onmouseup = function(){};
  // this.field.node.onreset = function(){};
  // this.field.node.onresize = function(){};
  // this.field.node.onselect = function(){};
  // this.field.node.onsubmit = function(){};
  // this.field.node.onunload = function(){};
};