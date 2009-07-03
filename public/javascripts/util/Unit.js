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
    this.old_config = this.get_config();
    if (this.troop_set !== undefined){
      this.troop_set.remove();
    }
    if (config.files === undefined){
      Skirmisher_Error(Constants.MISSING_VALUES_MESSAGE + 'config.files');} else {this.files = config.files;};
    if (config.model_count === undefined){
      Skirmisher_Error(Constants.MISSING_VALUES_MESSAGE + 'config.model_count');} else {this.model_count = config.model_count;}
    if (config.base === undefined){
      Skirmisher_Error(Constants.MISSING_VALUES_MESSAGE + 'config.base');} else {this.base = config.base;}
    this.x =          (config.x === undefined)?          0      : config.x;
    this.y =          (config.y === undefined)?          0      : config.y;
    this.theta =      (config.theta === undefined)?      0      : config.theta;
    this.selected =   (config.selected === undefined)?   false  : config.selected;
    this.fill_color = (config.fill_color === undefined)? 'transparent' : config.fill_color;
    this.wheel_direction = (config.wheel_direction === undefined)? Constants.LEFT : this.wheel_direction = config.wheel_direction;
    this.unit_width = this.files * this.base.width;
    this.skirmishing = (config.skirmishing === undefined)? false : config.skirmishing;
    this.ranks = this.model_count / this.files;
    this.unit_height = this.ranks * this.base.height;
    /**
     * Relative to this.x, this.y
     */
    this.unrotated_center = {
	x: this.x + this.unit_width/2,
	y: this.y + this.unit_height/2
      };

    /**
     * Returns the coords relative to this.x, this.y
     */
    function calculate_unit_center(){
      var new_coords = _rotate_point((unit_self.unrotated_center.x - unit_self.x), (unit_self.unrotated_center.y - unit_self.y), -1*unit_self.theta);
      return {
	x: (unit_self.x + new_coords.x),
	y: (unit_self.y + new_coords.y)
      };
    }

    this.unit_center = calculate_unit_center();

    // Don't allow theta to get ungodly and unneccessarily large.
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

    // Draw unit
    if (this.skirmishing){
      this.draw_skirmishing();
    } else {
      this.draw_rank_and_file();
    }

  };

  /**
   * Check if there's already a list of skirmisher locations
   * If so, draw with the current locations.
   * If not, enter PLACE_SKIRMISHERS mode.
   */
  this.draw_skirmishing = function(){
    if (this.skirmisher_list === undefined) {
      Mode.push(Constants.mode.PLACE_SKIRMISHERS);
    } else {
      // Redraw.
    }

  };

  /**
   * On click for Constants.mode.PLACE_SKIRMISHERS
   */
  this.place_skirmisher = function(){
    if (Mode.peek() != Constants.mode.PLACE_SKIRMISHERS) {
      Skirmisher_Error('In place_skirmisher, not in proper mode.');
    }
    if (this.skirmisher_list === undefined) {
      this.skirmisher_list = [];
    }
    var new_troop;
    if (this.skirmisher_list.length < this.model_count) {
      new_troop = new Troop({ x: Globals.mouse.x,
			      y: Globals.mouse.y,
			      base: unit_self.base,
			      fill_color: unit_self.fill_color,
			      selected: unit_self.selected,
			      parent: unit_self });
      this.skirmisher_list.push(new_troop);
      this.troop_set.push(new_troop);
    }
    if (this.skirmisher_list.length == this.model_count) {
      if (Mode.peek() == Constants.mode.PLACE_SKIRMISHERS) {
	Mode.pop();
      } else {
	Skirmisher_Error('Mode out of sync.  Should be PLACE_SKIRMISHERS. Is ' + Mode.peek());
      }
    } else if (this.skirmisher_list.length > this.model_count) {
      Skirmisher_Error('There are more skirmishers than allowed by model count.');
    }
  };

  this.draw_rank_and_file = function(){

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
   * Use the mouse as the reference by which to orient the unit.
   */
  this.pivot_to_mouse = function(){
	var delta = {
			y: Globals.mouse.y - this.unrotated_center.y,
			x: Globals.mouse.x - this.unrotated_center.x
	};
	var new_theta = (delta.y < 0)?Math.atan(delta.x/delta.y):(Math.PI + Math.atan2(delta.x, delta.y));
    this.do_pivot(new_theta);
  };

  /**
   * Perform a pivot - center of rotation on center of unit.
   * @param theta {float} - angle of rotation
   */
  this.do_pivot = function(theta) {
    var new_config = this.get_config();
    var old_center = this.unit_center;
    new_config.theta = theta;
    this.draw(new_config);
    new_config = this.get_config();
    var new_center = this.unit_center;
    new_config.x -= new_center.x - old_center.x;
    new_config.y -= new_center.y - old_center.y;
    this.draw(new_config);
  };

  this.mark_centers = function() {
    var uncenter = Globals.paper.ellipse(this.x, this.y, 5, 10);
    uncenter.attr('fill', 'blue');
    var center = Globals.paper.ellipse(this.x, this.y, 10, 5);
    center.attr('fill', 'red');
    uncenter.animate({cx: this.unrotated_center.x, cy: this.unrotated_center.y}, 1000);
    center.animate({cx: this.unit_center.x, cy: this.unit_center.y}, 1000);
  };

  /**
   * Returns the coords after the rotation relative
   * to the center of rotation.
   * @param x {float} - x coord relative to the center of rotation
   * @param y {float} - y coord relative to the center of rotation
   * @param theta {float} - angle of rotation
   */
  function _rotate_point(x, y, theta) {
	var new_coords = {};
    // Matrix rotation
    new_coords.x = (x*Math.cos(theta)) - (y*Math.sin(theta));
    new_coords.y = (x*Math.sin(theta)) + (y*Math.cos(theta));
    return new_coords;
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
    var new_config = this.get_config();
    new_config.x += x_offset;
    new_config.y += y_offset;
    this.draw(new_config);
    return this;
  };

  // I would put Teleport as it's own object, but for some reason I can't get that to work.  For now, this will work.
  // TODO: rewrite this some day.
  this.teleport_data = undefined;
  this.teleport_init = function(){
    unit_self.teleport_data = {};
    unit_self.teleport_data.click_offset = {
      x: Globals.mouse.x - unit_self.x,
      y: Globals.mouse.y - unit_self.y
    };
  };
  this.teleport_go = function(){
    if (unit_self.teleport_data){
      var new_config = unit_self.get_config();
      new_config.x = Globals.mouse.x + unit_self.teleport_data.click_offset.x;
      new_config.y = Globals.mouse.y + unit_self.teleport_data.click_offset.y;
      unit_self.draw(new_config);
    }
  };

  /**
   * select - makes this unit the active selection
   */
  this.select = function() {
    if (unit_self.selected){
      return unit_self.unselect();
    }
    // Unselect whatever has been selected
    if (Globals.selected !== undefined) {
      Globals.selected.unselect();
    }
    Globals.selected = unit_self;
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
