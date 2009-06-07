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
 */
function Unit(config) {
  var unit_self = this;
  /**
   * Constructor
   * @param config {hash} - see {@link Unit}
   * @param paper {Raphael} - rendering target
   */
  this.init = function(config) {
    this.draw(config);
  };

  /**
   * Renders the unit onto the paper
   * @param config {hash} - see {@link Unit}
   */
  this.draw = function(config){
    if (config === undefined){
      config = this.get_config();
    }
    if (this.troop_set !== undefined){
      this.troop_set.remove();
    }
    if (config.files === undefined){
      throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.files');} else {this.files = config.files;};
    if (config.model_count === undefined){
      throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.model_count');} else {this.model_count = config.model_count;}
    if (config.base === undefined){
      throw new Error (Constants.MISSING_VALUES_MESSAGE + 'config.base');} else {this.base = config.base;}
    this.x =          (config.x === undefined)?          0      : config.x;
    this.y =          (config.y === undefined)?          0      : config.y;
    this.theta =      (config.theta === undefined)?      0      : config.theta;
    this.selected =   (config.selected === undefined)?   false  : config.selected;
    this.fill_color = (config.fill_color === undefined)? 'transparent' : config.fill_color;
    this.wheel_direction = (config.wheel_direction === undefined)? Constants.LEFT : this.wheel_direction = config.wheel_direction;
    this.unit_width = this.files * this.base.width;
    this.skirmishing = (config.skirmishing === undefined)? false : config.skirmishing;
    this.ranks = this.model_count / this.files;
    this.unit_depth = this.ranks * this.base.width;
    this.unit_center = {
      x: this.x + this.unit_width/2,
      y: this.y + this.unit_depth/2
    };

    // Don't allow theta to get ungodly and uneccessarily large.
    while (this.theta > 2*Math.PI){
      this.theta -= 2*Math.PI;
      }
    while (this.theta < -2*Math.PI){
      this.theta += 2*Math.PI;
    }
    // The following need to be reset every time there is a redraw.
    /**
     * paper.set() of troops
     */
    if (Globals.paper !== undefined) {
      this.troop_set = Globals.paper.set();
    } else {
      throw new Error('paper is undefined');
    }

    /**
     * Number of models deep
     */
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
    var current_color = '#fff';
    var color_mod = 1;
    if (this.selected){
      color_mod += 2;
    }
    var x_mod = 0;
    var y_mod = 0;
    while (counter < this.model_count) {
      current_troop = new Troop({
                                  x: this.x+(this.base.width*current_col),
                                  y: this.y+(this.base.height*current_row),
                                  base: this.base,
                                  fill_color: (current_row === 0)?scale_color(config.fill_color, color_mod+2):scale_color(config.fill_color, color_mod),
				  selected: this.selected,
				  parent: this
                                });
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
    // This conditional block is to allow this.draw()
    // to call this.wheel(0) without causing an infinite
    // recursion loop.
    if (inches !== 0) {
      var distance = Convert.inch(inches);
      var new_config = this.get_config();
      //
      // Super Wheeling Action
      //
      // TODO: Figure out why wheeling right breaks
      //       move.  See map.html for horrible hack.
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
   * @param direction {integer} - refer to {@link Constants}
   */
  this.move = function(inches, direction) {
    var distance = direction * Convert.inch(inches);
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
   * Points the front of the unit at the mouse.
   */
    this.pivot = function(){

    };

  this.teleport = function(){
    var teleport_self = this;
    this.init = function(){
      teleport_self.click_offset = {
	x: Globals.mouse.x - this.x,
	y: Globals.mouse.y - this.y
      };
    };
    this.go = function(){
      var new_config = unit_self.get_config();
      new_config.x += Globals.mouse.x + teleport_self.click_offset.x;
      new_config.y += Globals.mouse.y + teleport_self.click_offset.y;
      unit_self.draw(new_config);
    };
  };

  /**
   * select - makes this unit the active selection
   */
  this.select = function() {
    if (this.selected){
      return this.unselect();
    }
    // Unselect whatever has been selected
    if (Globals.selected !== undefined) {
      Globals.selected.unselect();
    }
    Globals.selected = this;
    this.selected = true;
    this.draw();
    return this;
  };

  /**
   * unselect - removes this from the active selection
   */
  this.unselect = function() {
    Globals.selected = undefined;
    this.selected = false;
    this.draw();
    return this;
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
      wheel_direction: this.wheel_direction,
      selected: this.selected,
      skirmishing: this.skirmishing
    };
    return config;
  };

  this.describe = function(){
    tmp('Theta: ' + this.theta);
    tmp('Last Wheel: ' + this.wheel_direction);
    tmp('(x,y): ' + this.x + ', ' + this.y);
  };

  this.init(config);
}
