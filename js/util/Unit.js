/**
 * Class specific errors
 */
var MISSING_VALUES_MESSAGE = 'Config is missing: ';

/**
 * This holds all the troops, and provides unit-level actions
 * @class Unit
 * @param config {hash}- config object
 * @cfg files {int} - Frontage of unit (columns)
 * @cfg model_count {int} - Number of models in unit.
 * @cfg base {Base} - base size object
 * @cfg x {int} - x coordinate
 * @cfg y {int} - y coordinate
 * @cfg fill_color {string} - fill color
 * @param paper {Raphael} - rendering target
 */
function Unit(config, paper) {
  /**
   * Constructor
   * @param config {hash} - see {@link Unit}
   * @param paper {Raphael} - rendering target
   */
  this.init = function(config, paper) {
    this.paper = paper;
    this.draw(config);
  };

  /**
   * Renders the unit onto the paper
   * @param config {hash} - see {@link Unit}
   */
  this.draw = function(config){
    if (config.files === undefined)      {throw new Error (MISSING_VALUES_MESSAGE + 'config.files');} else {this.files = config.files;};
    if (config.model_count === undefined){throw new Error (MISSING_VALUES_MESSAGE + 'config.model_count');} else {this.model_count = config.model_count;}
    if (config.base === undefined)       {throw new Error (MISSING_VALUES_MESSAGE + 'config.base');} else {this.base = config.base;}
    this.x =          (config.x === undefined)?          0      : config.x;
    this.y =          (config.y === undefined)?          0      : config.y;
    this.theta =      (config.theta === undefined)?      0      : config.theta;
    this.fill_color = (config.fill_color === undefined)? '#fff' : config.fill_color;
    this.selected =   (config.selected === undefined)?   false  : true;
    // The following need to be reset every time there is a redraw.
    /**
     * paper.set() of troops
     */
    this.troop_set = this.paper.set();

    /**
     * Number of models deep
     */
    this.ranks = this.model_count / this.files;
    if (this.model_count % this.files > 0) {
      this.ranks++;
    }
    /**
     * Matrix of troops
     */
    this.troops = [];
    for (var i = 0; i < this.ranks; i++) {
      this.troops.push([]);
    }


    // Generate troops.  Maintain both matrix and
    // paper.set() of troops. Also store references
    // in a paper.set() for easy working with all
    // troops at once.
    var current_row = 0;
    var current_col = 0;
    var current_troop = undefined;
    var counter = 0;
    while (counter < this.model_count) {
      current_troop = new Troop({
				  x: this.x+(this.base.width*current_col),
				  y: this.y+(this.base.height*current_row),
				  base: this.base,
				  fill_color: config.fill_color
				}, this.paper);

      // TODO: Make a "createDelegate" function, if I
      // end up doing this too many times:
      var self = this;
      current_troop.base.node.onclick = function() {
	self.select();
      };
      // Add troop to both set and matrix, so I have
      // different ways of accessing the troop:
      // select by rank and/or file or if I want
      // to act on all troops via .set() functions.
      this.troops[current_row].push(current_troop);
      this.troop_set.push(current_troop.base);
      counter++;

      // Cycle current_[col|row] to build ranks and files
      if (current_col%this.files == this.files-1) {
	current_col = 0;
	current_row++;
      } else {
	current_col++;
      }

    }

    // If the back row is incomplete, move each base so the back row is centered.
    if (current_col !== 0) {
      var offset = (this.files-current_col)/2*this.base.width;
      var back_row = this.troops[current_row];
      for (var k = 0; k < back_row.length; k++) {
	back_row[k].base.translate(offset, 0);
      }
    }
  };
  /**
   * Perform a wheel - pivot on a front corner and turn.
   * @param inches {float} - Arc distance, in inches
   * @param left {boolean} - If true, go left. If false, go right.
   */
  this.wheel = function(inches, left) {
    if (left == undefined) {
      left = (this.theta > 0)? false : true;
    }
    // Set up the unit
    var arc_length = Convert.inch(inches);
    var unit_width = this.files * this.base.width;
    var new_config = this.get_config();
    var direction = (left)?-1:1;
    var sub_theta = direction * arc_length/unit_width;
    new_config.theta = sub_theta + this.theta;

    // The variable names are referencing a diagram I have drawn out.
    if ( (left && this.theta > 0) || (!left && this.theta < 0) ){
      // Figure out where the first reference x,y will be.
      var one_x = this.x + (unit_width * Math.cos(this.theta));
      var one_y = this.y + (unit_width * Math.sin(this.theta));
      var one = this.paper.rect(one_x, one_y, 5, 5);
      one.attr('fill', 'white');
      tmp('one_x_y');
      // Figure out what the difference of the angle is, to figure out how far back we need to go.
      var two_theta = (this.theta - sub_theta);
      // The position of the unit after it's been unwheeled
      var three_x = one_x + Math.cos(two_theta);
      var three_y = one_y - Math.sin(two_theta);
      var two = this.paper.rect(three_x, three_y, 5, 5);
      two.attr('fill', 'gray');
      tmp('three_x_y: ' + Math.cos(two_theta)+','+Math.sin(two_theta) );
      // The final position of the unit, prewheel
      var four_x = three_x - unit_width;
      var four_y = three_y;
      var three = this.paper.rect(four_x, four_y, 5, 5);
      three.attr('fill', 'black');
      tmp('four_x_y');
      new_config.x = four_x;
      new_config.y = four_y;
      // Set the wheel for the redraw.
      new_config.theta = two_theta;
    }
    this.draw(new_config);

    // Do the rotation
    var rotation_center_x = this.x + unit_width;
    var rotation_center_y = this.y;
    this.theta = sub_theta + this.theta;
    if (left) {
      rotation_center_x = this.x;
      this.theta = -1 * Math.abs(this.theta);
    }
    tmp('THETA: ' + this.theta);
    this.troop_set.rotate(Convert.degrees(this.theta), rotation_center_x, rotation_center_y);

  };

  /**
   * move - move the unit in a straight line.
   * @param inches {float} - Move distance
   * @param forward {boolean} - If true, go
   * forward. If false, go backward.
   */
  this.move = function(inches, forward) {
    var direction = -1;
    if (!forward) {
      direction = 1;
    }
    var distance = direction*Convert.inch(inches);
    var x_direction = -1;
    var x_offset = distance*Math.sin(this.theta);
    var y_offset = distance*Math.cos(this.theta);
    var new_config = this.get_config();
    new_config.x += x_direction * x_offset;
    new_config.y += y_offset;
    this.draw(new_config);
    // TODO: Is there a better way to do this? Need
    // to force a reevaluation of the unit's current
    // theta.
    this.wheel(0);
  };

  /**
   * select - makes this unit the active selection
   */
  this.select = function() {
    if (this.selected) {
      this.unselect();
    } else {
      this.selected = true;
      this.troop_set.attr({stroke: '#949',
			   'stroke-width': 2});
    }
  };

  /**
   * unselect - removes this from the active selection
   */
  this.unselect = function() {
    if (this.selected) {
      this.selected = false;
      this.troop_set.attr({stroke: '#000',
			   'stroke-width': 1});
    }
  };

  this.show_controls = function() {

  };

  this.get_config = function() {
    return {
      files: this.files,
      model_count: this.model_count,
      base: this.base,
      x: this.x,
      y: this.y,
      fill_color: this.fill_color,
      theta: this.theta
    };
  };
  this.init(config, paper);
}
