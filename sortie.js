
/**
 * Covert offers helper functions for translating various
 * real world measurements into Skirmisher standard measurements.
 * If this could be static in JavaScript, it would be.
 * (note how there's no constructor.)
 * @class Convert
 */
var Convert = {
// use 10px = 1" = 25mm the universal standard
  inch: function(x){
    return 10*x;
  },
  foot: function(x){
    return 12*this.inch(x);
  },
  mm: function(x){
    return x/2.5;
  },
  degrees: function(radians){
    return radians*(180/Math.PI);
  }
};
/**
 * Base object holding the dimensions of the represented base.
 * TODO: Research if Troop and Base should be merged.
 * @class Base
 * @param width - width
 * @param height - height
 */
var Base = function(width, height) {
  return {
    width: Convert.mm(width),
    height: Convert.mm(height)
  };
};
var base_20mm = new Base(20, 20);
var base_25mm = new Base(25, 25);
var base_cavalry = new Base(25, 50);
var base_40mm = new Base(40, 40);
var base_50mm = new Base(50, 50);
var base_chariot = new Base(50, 100);

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

////////////////////////////////////////////////////////TODO: Split files.

window.onload = function(){
  /**
   * The rendering target.
   */
   var paper = Raphael(10, 50, 740, 500);

  /**
   * The field.
   * TODO: Use the Field constructor
   */
   var field = paper.rect(0, 0, 740, 500);
   field.attr("stroke", "black");
   field.attr("stroke-width", 10);
   field.attr("fill", "#080");

   // Generate top border px markers
   var marker = undefined;
   for (var i = 10; i <= 730; i += 10){
     marker = paper.text(i, 10, ((i-10)%100)/10);
     marker.attr("fill", "black");
     if (i <= 490) {
       marker = paper.text(10, i, ((i-10)%100)/10);
       marker.attr("fill", "black");
     }
   }

  var wheel = 1;
  var move = 15;
  var models = 5;
  var files = 5;
  tmp('-----5--purple---');
  var test_unit5 = new Unit({
  			  files: files,
  			  model_count: models,
  			  base: base_25mm,
  			  x: 100,
  			  y: 300,
			  fill_color: 'purple'
  			}, paper);
  test_unit5.wheel(wheel);

  tmp('-----6--blue---');
  var test_unit6 = new Unit({
  			  files: files,
  			  model_count: models,
  			  base: base_cavalry,
  			  x: 100,
  			  y: 300,
			  fill_color: 'blue'
  			}, paper);
  test_unit6.wheel(wheel);


  test_unit5.move(move);


 };

////////////////////////////////////////////////////////TODO: Split files

/**
 * Represents an individual model on the board.
 * @class Troop
 * @param config {JSON} - config object
 * @cfg x {int} - x coordinate of top left corner of base
 * @cfg y {int} - y coordinate of top left corner of base
 * @cfg base {Base} - base object
 * @cfg fill_color {string} - fill color
 * @param paper {Raphael} - rendering target
 */
function Troop(config, paper) {
  this.x = config.x;
  this.y = config.y;
  this.fill_color = config.fill_color;
  this.base = paper.rect(this.x,
			 this.y,
			 this.base.width-1,
			 this.base.height-1);
  this.base.attr({stroke: 'black',
		  fill: this.fill_color});
}


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
    if (left) {
      degree_mod = -1;
    }
    var arc_length = Convert.inch(inches);
    var unit_width = this.files * this.base.width;
    this.theta = arc_length/unit_width;
    this.troop_set.rotate(degree_mod*Convert.degrees(this.theta), this.x, this.y);
    this.rotation = degree_mod*Convert.degrees(this.theta);
  };

  /**
   * move - move the unit in a straight line.
   * @param inches {float} - Move distance
   * @param forward {boolean} - If true, go forward. If false, go backward.
   */
  this.move = function(inches, forward) {
    var direction = 1;
    if (forward)
    var distance = direction*Convert.inch(inches);
    this.troop_set.translate(0, distance);
  };
}

function tmp_obj(obj){
  var str = '';
  for (i in obj){
    str += i + ': ' + obj[i] + "\n";
  }
  alert(str);
}

function tmp(str){
  var txt = document.createTextNode(str);
  var br = document.createElement('br');
  document.getElementById('tmp').appendChild(txt);
  document.getElementById('tmp').appendChild(br);
}