/**
 * Generates a ruler which gives distance information.
 */

var Ruler = {
  init: function(){
    var self = this;
    this.start_location = {
      x: Globals.mouse.x,
      y: Globals.mouse.y
    };
    this.draw();
  },
  draw: function(){
    var self = this;
    if (this.ruler !== undefined) {
      this.ruler.remove();
      this.ruler = undefined;
    }
    if (this.info !== undefined) {
      this.info.remove();
      this.info = undefined;
    }
    if (this.info_text !== undefined) {
      this.info_text.remove();
      this.info_text = undefined;
    }
    if (!this.on){
      return;
    }
    var offset_x = (Globals.mouse.x) - this.start_location.x;
    var offset_y = (Globals.mouse.y) - this.start_location.y;
    var length = Math.sqrt((offset_x*offset_x) + (offset_y*offset_y));
    this.ruler = Globals.paper.rect(this.start_location.x, this.start_location.y, length, 2);
    if (offset_x >= 0){
      this.theta = Math.atan(offset_y/offset_x);
    } else {
      this.theta = Math.atan2(offset_y, offset_x);
    }
    this.ruler.rotate(Convert.degrees(this.theta), this.start_location.x, this.start_location.y);
    var x_mod = 1;
    var y_mod = 1;
    if (Globals.mouse.x > Globals.field_width-100) {
      x_mod = -3;
    }
    if (Globals.mouse.y > Globals.field_height-100) {
      y_mod = -2;
    }
    var box = {
      x: x_mod*20 + Globals.mouse.x,
      y: y_mod*20 + Globals.mouse.y
    };
    this.info = Globals.paper.rect(box.x, box.y, 40, 20);
    this.info.attr({
		     stroke: '#000',
		     'stroke-width': 1,
		     fill: '#fff',
		     'fill-opacity': .5
		   });
    this.info_text = Globals.paper.text(box.x+20, box.y+8, (length/10).toFixed(2));
  },
  toggle: function(switcher){
    if (switcher !== undefined){
      this.on = switcher;
      return;
    }
    if (this.on){
      this.on = false;
      this.draw();
    } else {
      this.on = true;
      this.init();
    }
  }
};