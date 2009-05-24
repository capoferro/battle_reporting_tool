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

    if (config.files === undefined)      {throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.files');} else {this.files = config.files;};
    if (config.model_count === undefined){throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.model_count');} else {this.model_count = config.model_count;}
    if (config.base === undefined)       {throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.base');} else {this.base = config.base;}
    this.x =          (config.x === undefined)?          0      : config.x;
    this.y =          (config.y === undefined)?          0      : config.y;
    this.theta =      (config.theta === undefined)?      0      : config.theta;
    this.fill_color = (config.fill_color === undefined)? '#fff' : config.fill_color;
    this.selected =   (config.selected === undefined)?   false  : true;
    this.wheel_direction = (config.wheel_direction === undefined)? /* default to left */ Constants.LEFT : this.wheel_direction = config.wheel_direction;
    this.unit_width = this.files * this.base.width;
    // The following need to be reset every time there is a redraw.
    /**
     * paper.set() of troops
     */
    if (paper !== undefined) {
      this.troop_set = this.paper.set();
    } else {
      throw new Error('paper is undefined');
    }

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
                                }, paper);

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
      var offset = (this.files-current_col)/2 * this.base.width;
      var back_row = this.troops[current_row];
      for (var k = 0; k < back_row.length; k++) {
        back_row[k].base.translate(offset, 0);
      }
    }
    // Evaluate the current set wheel that was passed in by the config.
    this.wheel(0, this.direction);
  };
  /**
   * Perform a wheel - pivot on a front corner and turn.
   * @param inches {float} - Arc distance, in inches
   * @param left {boolean} - If true, go left. If false, go right.
   */
  this.wheel = function(inches, direction) {
    if (direction === undefined){
      if (this.wheel_direction === undefined) {
        throw new Error('Wheel direction not given, and no prior wheel direction specified');
      } else {
        direction = this.wheel_direction;
      }
    }
    // tmp('after undef: ' + inches + '" | ' + this.theta + ' theta');

    // This conditional block is to allow this.draw()
    // to call this.wheel without causing an infinite
    // recursion loop.
    if (inches !== 0) {
      var distance = Convert.inch(inches);
      var new_config = this.get_config();
      //
      // Super Wheeling Action
      //
      // If we are wheeling the opposite way than the
      // unit wheeled last time, then we need to do
      // some unusual calculations.  (Wish I could
      // draw a picture...!)
      if (direction !== this.wheel_direction){
      // Steps:
      // 1. Flip the angle, since we want to wheel
      //    backwards from our new position to match
      //    the current angle, just from a different
      //    point of rotation.
        new_config.theta = this.theta * -1;
      // 2. Figure out where the forward most corner
      //    of the unit is (left if the unit has
      //    wheeled right in the past, right if the
      //    unit has wheeled left in the past.)
      //    NOTE: this.x and this.y are not going to
      //          give you this, as those attributes
      //          will only tell you where the left
      //          corner has wheeled from.  If the
      //          unit has wheeled to the right, then
      //          this will be different than this.x
      //          and this.y
        new_config.x = this.x + (direction*(this.unit_width * Math.cos(new_config.theta) - this.unit_width));
        new_config.y = this.y + (this.unit_width * Math.sin(new_config.theta));
      // 3. Make sure we remember which way we intend
      //    to wheel for the redraw.
        new_config.wheel_direction = direction;
      }
      // 4. Factor in the new wheel right before we
      //    draw.
      new_config.theta += distance/this.unit_width;
      // 5. Redraw!
      this.draw(new_config);
      return this;
    } // 6. Using the calculated theta in the new
      //    drawing, we can perform the proper
      //    wheel.
    if (this.wheel_direction === Constants.LEFT) {
      this.troop_set.rotate(this.wheel_direction * Convert.degrees(this.theta), this.x, this.y);
    } else {
      this.troop_set.rotate(this.wheel_direction * Convert.degrees(this.theta), this.x + this.unit_width, this.y);
    }
    return this;
  };


  /**
   * move - move the unit in a straight line.
   * @param inches {float} - Move distance
   * @param forward {boolean} - If true, go
   * forward. If false, go backward.
   */
  this.move = function(inches, forward) {
    var distance = forward * Convert.inch(inches);
    var x_offset = distance * Math.sin(this.theta);
    var y_offset = distance * Math.cos(this.theta);
    tmp('moving (x,y): ('+x_offset+','+y_offset+')');
    var new_config = this.get_config();
    new_config.x += x_offset;
    new_config.y += y_offset;
    this.draw(new_config);
    return this;
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
    var config = {
      files: this.files,
      model_count: this.model_count,
      base: this.base,
      x: this.x,
      y: this.y,
      fill_color: this.fill_color,
      theta: this.theta,
      wheel_direction: this.wheel_direction
    };
    return config;
  };
  this.init(config, paper);
}
