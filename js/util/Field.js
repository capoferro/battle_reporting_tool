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
var Field = function(config, paper) {
  this.width = Convert.foot(config.width);
  this.height = Convert.foot(config.height);
  this.x = config.x;
  this.y = config.y;
  this.field = paper.rect(this.x,
			  this.y,
			  this.width,
			  this.height);
  this.field.attr({stroke: config.stroke,
		   'stroke-width': config.border,
		   fill: config.fill_color
		  });
};