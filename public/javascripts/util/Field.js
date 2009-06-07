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

  generate_event_template(this.field.node);
};