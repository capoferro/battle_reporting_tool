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
    var degree_mod = 1;
    var unit_width = this.files * this.base.width;
    var rotation_center_x = this.x + unit_width;
    var rotation_center_y = this.y;
    var arc_length = Convert.inch(inches);
    if (left) {
      degree_mod = -1;
      rotation_center_x = this.x;
    }

    this.theta = this.theta + arc_length/unit_width;
    this.troop_set.rotate(degree_mod*Convert.degrees(this.theta), rotation_center_x, rotation_center_y);
    this.rotation = degree_mod*Convert.degrees(this.theta);
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
    var x_offset = distance*Math.sin(this.theta);
    var y_offset = distance*Math.cos(this.theta);
    var new_config = this.get_config();
    new_config.x -= x_offset;
    new_config.y += y_offset;
    new_config.fill_color = "black";
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
    inspect(this);
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
