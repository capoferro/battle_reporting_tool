/**
 * This holds all the troops, and provides unit-level actions
 * @class Unit
 * @param config {JSON}- config object
 * @cfg files {int} - Frontage of unit (columns)
 * @cfg model_count {int} - Number of models in unit.
 * @cfg troop {Troop} - troop object
 * @cfg x {int} - x coordinate
 * @cfg y {int} - y coordinate
 * @cfg fill_color {string} - fill color
 * @param paper {Raphael} - rendering target
 */
function Unit(config, paper) {
  if (!config.fill_color) {
    config.fill_color = '#fff';
  }
  this.files = config.files;
  this.model_count = config.model_count;
  this.base = config.base;
  this.rotation = 0;
  this.x = config.x;
  this.y = config.y;
  this.theta = 0;

  /**
   * paper.set() of troops
   */
  this.troop_set = paper.set();

  /**
   * Matrix of troops
   */
  var rows = this.model_count / this.files;
  if (this.model_count % this.files > 0) {
    rows++;
  }
  this.troops = [];
  for (var i = 0; i < rows; i++) {
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
  var troop_config;
  while (counter < this.model_count) {

    troop_config = {
      x: this.x+(this.base.width*current_col),
      y: this.y+(this.base.height*current_row),
      base: this.base,
      fill_color: config.fill_color
    };
    current_troop = new Troop(troop_config, paper);

    // Add troop to both set and matrix.
    this.troops[current_row].push(current_troop);
    this.troop_set.push(current_troop.base);
    counter++;
    if (current_col%this.files == this.files-1) {
      current_col = 0;
      current_row++;
    } else {
      current_col++;
    }

  }

  // If the back row is incomplete, move each base so the back row is centered.
  if (current_col != 0) {
    var offset = (this.files-current_col)/2*this.base.width;
    var back_row = this.troops[current_row];
    for (var k = 0; k < back_row.length; k++) {
      back_row[k].base.translate(offset, 0);
    }
  }

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

    this.theta = arc_length/unit_width;
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
    var direction = 1;
    if (!forward) {
      direction = -1;
    }
    var distance = direction*Convert.inch(inches);
    this.troop_set.translate(0, distance);
  };
}
