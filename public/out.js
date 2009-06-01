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
var base_Cavalry = new Base(25, 50);
var base_40mm = new Base(40, 40);
var base_50mm = new Base(50, 50);
var base_Chariot = new Base(50, 100);

/**
 * Represents an individual model on the board.
 * @class Troop
 * @param config {JSON} - config object
 * @cfg x {int} - x coordinate of top left corner of base
 * @cfg y {int} - y coordinate of top left corner of base
 * @cfg base {Base} - base object
 * @cfg fill_color {string} - fill color
 */
function Troop(config) {
  this.x = config.x;
  this.y = config.y;
  this.fill_color = (config.fill_color.charAt(0) == '#')?config.fill_color:('#'+config.fill_color);
  this.selected = config.selected;
  this.stroke_color = '#000';

  if (Globals.paper !== undefined) {
    this.base = Globals.paper.rect(this.x,
			   this.y,
			   config.base.width-1,
			   config.base.height-1);
  } else {
    throw new Error('paper is undefined');
  }
  this.base.attr({stroke: this.stroke_color,
		  'stroke-opacity': (this.selected)?.5:1,
		  fill: this.fill_color});
}/**
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
    var current_color = '#fff';
    var color_mod = 1;
    if (this.selected){
      color_mod += 2;
    }
    var x_mod = 0;
    var y_mod = 0;
    while (counter < this.model_count) {
      tmp(counter);
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
    this.pivot = function(){
      var unit_center = {
	x: this.unit_width/2,
	y: this.ranks*this.base.height/2
      };
      var mouse_offset = {
	x: Globals.mouse.x - unit_center.x,
	y: Globals.mouse.y - unit_center.y,
	// Note: 'this' is mouse_offset, in case I'm dumb
	//       when I read this code in future.
	theta: atan(this.x/this.y)
      };

      var new_config = this.get_config();
      new_config.theta = 90 - mouse_offset.theta;
      this.draw(new_config);

    };
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
/**
 * This object specifies event handlers so they can all stay in sync.
 */
var Mode = {
  DEFAULT: 'DEFAULT',
  UNIT_SELECTED: 'UNIT_SELECTED',
  UNIT_PIVOT: 'UNIT_PIVOT'
};/**
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
    Globals.field.node.onmousemove = function(){self.draw();};
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
    this.ruler.node.onclick = function(){self.toggle(false);};
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
};$(document).ready(function(){
		    alert('making paper');
  Globals.paper = Rafael(10, 10, Constants.paper.WIDTH, Constants.paper.HEIGHT);
		    alert('done making paper');
  /**
   * The field.
   * TODO: Use the Field constructor
   */
   Globals.field = new Field({
      width: 6,
      height: 4,
      x: 0,
      y: 0,
      stroke: '#000',
      stroke_width: 10,
      fill_color: '#080'
    });


});
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

  Globals.paper.rect(10, 10, 10, 10);
  this.width = Convert.foot(config.width);
  this.height = Convert.foot(config.height);
  this.x = config.x;
  this.y = config.y;
  this.field = Globals.paper.rect(this.x,
				  this.y,
				  this.width,
				  this.height);
  this.field.attr({stroke: config.stroke,
		   'stroke-width': config.stroke-width,
		   fill: config.fill_color
		  });





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

  // this.field.node.onabort = function(){};
  // this.field.node.onblur = function(){};
  // this.field.node.onchange = function(){};
  this.field.node.onclick = function(){
    switch (Globals.mode) {
    case Constants.mode.NEW_UNIT:
      Globals.queued_unit.x = Globals.mouse.x;
      Globals.queued_unit.y = Globals.mouse.y;
      var last_unit = new Unit(Globals.queued_unit);
      Globals.queued_unit = undefined;
      Globals.selected = last_unit;
      Globals.mode = Constants.mode.DEFAULT;
      break;
    default:
      Ruler.toggle();
    }
  };
  // this.field.node.ondblclick = function(){};
  // this.field.node.onerror = function(){};
  // this.field.node.onfocus = function(){};
  // this.field.node.onkeydown = function(){};
  // this.field.node.onkeypress = function(){};
  // this.field.node.onkeyup = function(){};
  // this.field.node.onload = function(){};
  // this.field.node.onmousedown = function(){};
  // this.field.node.onmousemove = function(){};
  // this.field.node.onmouseout = function(){};
  // this.field.node.onmouseover = function(){};
  // this.field.node.onmouseup = function(){};
  // this.field.node.onreset = function(){};
  // this.field.node.onresize = function(){};
  // this.field.node.onselect = function(){};
  // this.field.node.onsubmit = function(){};
  // this.field.node.onunload = function(){};
};/**
 * These are predefined constants. Go figure.
 * @class Constants
 */
var Constants = {
  LEFT: -1,
  UP: -1,
  RIGHT: 1,
  DOWN: 1,
  FORWARD: -1,
  BACKWARD: 1,
  MISSING_VALUES_MESSAGE: 'Config is missing: ',
  mode: {
    DEFAULT: 'DEFAULT',
    NEW_UNIT: 'NEW_UNIT',
    UNIT_SELECTED: 'UNIT_SELECTED',
    UNIT_PIVOT: 'UNIT_PIVOT'
  },
  paper: {
    WIDTH: 750,
    HEIGHT: 500
  }
};

/**
 * These are things that I'd rather not have
 * to pass around as parameters, as there's
 * no reason to have more than one of each.
 * @class Globals
 */
var Globals = {
  field: undefined,
  selected: undefined,
  queued_unit: undefined,
  paper: undefined,
  mouse: {
    x: 0,
    y: 0
  },
  mode: Constants.mode.DEFAULT
};

/**
 * Covert offers helper functions for translating various
 * real world measurements into Skirmisher standard measurements.
 * If this could be static in JavaScript, it would be.
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
 * @param path - path to JavaScript file.
 */
function include(path){
    document.write('<script src="'+path+'" type="text/javascript"></script>');
  }

/**
 * @param obj - Object to be inspected
 */
function inspect(obj){
  var str = '';
  for (i in obj){
    str += i + ': ' + obj[i] + "\n";
  }
  tmp(str);

}

/**
 * @param str - String to be printed in the status div: #out.
 */
function tmp(str){
  var tmp = $('#out');
  tmp.html(str);

}

/**
 * Things to be done when the page loads.
 */
jQuery(document).ready(function(){
  $().mousemove(function(e){
		  Globals.mouse.x = e.pageX - Globals.paper.$.position().left;
		  Globals.mouse.y = e.pageY - Globals.paper.$.position().top;
		});
  });



/**
 * * *
 * Thank God someone wrote this for me.
 * * *
 * This script and many more are available free online at
 * The JavaScript Source!! http://javascript.internet.com
 * Created by: Joseph Myers | http://www.codelib.net/
 */
function scale_color(hexstr, scalefactor) {
  /* declared variables first, in order;
   afterwards, undeclared local variables */
  var r = scalefactor;
  var a, i;
  if (r < 0 || typeof(hexstr) != 'string') {
    return hexstr;
  }
  hexstr = hexstr.replace(/[^0-9a-f]+/ig, '');
  if (hexstr.length == 3) {
    a = hexstr.split('');
  } else if (hexstr.length == 6) {
    a = hexstr.match(/(\w{2})/g);
  } else {
    return hexstr;
  }
  for (i=0; i<a.length; i++) {
    if (a[i].length == 2)
      a[i] = parseInt(a[i], 16);
    else {
      a[i] = parseInt(a[i], 16);
      a[i] = a[i]*16 + a[i];
    }
  }

  var maxColor = parseInt('ff', 16);

  function relsize(a) {
    if (a == maxColor)
      return Infinity;
    return a/(maxColor-a);
  }

  function relsizeinv(y) {
    if (y == Infinity)
      return maxColor;
    return maxColor*y/(1+y);
  }

  for (i=0; i<a.length; i++) {
    a[i] = relsizeinv(relsize(a[i])*r);
    a[i] = Math.floor(a[i]).toString(16);
    if (a[i].length == 1)
      a[i] = '0' + a[i];
  }
  return '#' + a.join('');
}

// function showrainbow(f) {
//   var colorcell, hex, i, nhex;
//   hex = f.orig.value;
//   hex = hex.replace(/\W/g, '');
//   nhex = colorscale(hex, f.scalef.value-0);
//   if (nhex != hex) {
//     f.outp.value = nhex;
//     colorcell = document.getElementById('origcolor');
//     i = document.getElementById('newcolor');
//     colorcell.style.background = '#' + hex;
//     i.style.background = '#' + nhex;
//     for (i=0; i<256; i++) {
//       colorcell = document.getElementById('colorcell'+i);
//       nhex = colorscale(hex, i/(256-i));
//       colorcell.style.background = '#' + nhex;
//       colorcell.nhexvalue = nhex;
//     }
//   }
// }

function css(path){
  document.write('<link rel="stylesheet" type="text/css" href="'+path+'" />');
}
function js(path){
  document.write('<script src="'+path+'" type="text/javascript"></script>');
}

  js('/javascripts/lib/raphael.js');
  js('/javascripts/lib/jquery.js');
  js('/javascripts/lib/colorpicker.js');
  js('/javascripts/util/helper.js');
  js('/javascripts/util/Ruler.js');
  js('/javascripts/util/Unit.js');
  js('/javascripts/util/Troop.js');
  js('/javascripts/util/Base.js');
  js('/javascripts/util/Field.js');
  js('/javascripts/scratch.js');
  js('/javascripts/util/init.js');
  inspect(Globals);// Set up all the files needed for the color picker jquery plug in.
css('/javascripts/lib/colorpicker/css/colorpicker.css');
css('/javascripts/lib/colorpicker/css/layout.css');
js('/javascripts/lib/colorpicker/js/colorpicker.js');
js('/javascripts/lib/colorpicker/js/eye.js');
js('/javascripts/lib/colorpicker/js/utils.js');
js('/javascripts/lib/colorpicker/js/layout.js');/*
 * Raphael 0.7.4 - JavaScript Vector Library
 *
 * Copyright (c) 2008 - 2009 Dmitry Baranovskiy (http://raphaeljs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */


window.Raphael = (function () {
    var separator = /[, ]+/,
        doc = document,
        win = window,
        R = function () {
            return create.apply(R, arguments);
        },
        paper = {},
        availableAttrs = {cx: 0, cy: 0, fill: "#fff", "fill-opacity": 1, font: '10px "Arial"', "font-family": '"Arial"', "font-size": "10", "font-style": "normal", "font-weight": 400, gradient: 0, height: 0, href: "http://raphaeljs.com/", opacity: 1, path: "M0,0", r: 0, rotation: 0, rx: 0, ry: 0, scale: "1 1", src: "", stroke: "#000", "stroke-dasharray": "", "stroke-linecap": "butt", "stroke-linejoin": "butt", "stroke-miterlimit": 0, "stroke-opacity": 1, "stroke-width": 1, target: "_blank", "text-anchor": "middle", title: "Raphael", translation: "0 0", width: 0, x: 0, y: 0},
        availableAnimAttrs = {cx: "number", cy: "number", fill: "colour", "fill-opacity": "number", "font-size": "number", height: "number", opacity: "number", path: "path", r: "number", rotation: "csv", rx: "number", ry: "number", scale: "csv", stroke: "colour", "stroke-opacity": "number", "stroke-width": "number", translation: "csv", width: "number", x: "number", y: "number"},
        events = ["click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup"];
    R.version = "0.7.4";
    R.type = (window.SVGAngle ? "SVG" : "VML");
    R.svg = !(R.vml = R.type == "VML");
    R.idGenerator = 0;
    R.fn = {};
    R.toString = function () {
        return  "Your browser " + (this.vml ? "doesn't ": "") + "support" + (this.svg ? "s": "") +
                " SVG.\nYou are running " + unescape("Rapha%EBl%20") + this.version;
    };
    R.setWindow = function (newwin) {
        win = newwin;
        doc = win.document;
    };
    // colour utilities
    R.hsb2rgb = function (hue, saturation, brightness) {
        if (typeof hue == "object" && "h" in hue && "s" in hue && "b" in hue) {
            brightness = hue.b;
            saturation = hue.s;
            hue = hue.h;
        }
        var red,
            green,
            blue;
        if (brightness == 0) {
            return {r: 0, g: 0, b: 0, hex: "#000"};
        }
        if (hue > 1 || saturation > 1 || brightness > 1) {
            hue /= 255;
            saturation /= 255;
            brightness /= 255;
        }
        var i = Math.floor(hue * 6),
            f = (hue * 6) - i,
            p = brightness * (1 - saturation),
            q = brightness * (1 - (saturation * f)),
            t = brightness * (1 - (saturation * (1 - f)));
        red = [brightness, q, p, p, t, brightness, brightness][i];
        green = [t, brightness, brightness, q, p, p, t][i];
        blue = [p, p, t, brightness, brightness, q, p][i];
        red *= 255;
        green *= 255;
        blue *= 255;
        var rgb = {r: red, g: green, b: blue};
        var r = Math.round(red).toString(16);
        if (r.length == 1) {
            r = "0" + r;
        }
        var g = Math.round(green).toString(16);
        if (g.length == 1) {
            g = "0" + g;
        }
        var b = Math.round(blue).toString(16);
        if (b.length == 1) {
            b = "0" + b;
        }
        rgb.hex = "#" + r + g + b;
        return rgb;
    };
    R.rgb2hsb = function (red, green, blue) {
        if (typeof red == "object" && "r" in red && "g" in red && "b" in red) {
            blue = red.b;
            green = red.g;
            red = red.r;
        }
        if (typeof red == "string") {
            var clr = getRGB(red);
            red = clr.r;
            green = clr.g;
            blue = clr.b;
        }
        if (red > 1 || green > 1 || blue > 1) {
            red /= 255;
            green /= 255;
            blue /= 255;
        }
        var max = Math.max(red, green, blue),
            min = Math.min(red, green, blue),
            hue,
            saturation,
            brightness = max;
        if (min == max) {
            return {h: 0, s: 0, b: max};
        } else {
            var delta = (max - min);
            saturation = delta / max;
            if (red == max) {
                hue = (green - blue) / delta;
            } else if (green == max) {
                hue = 2 + ((blue - red) / delta);
            } else {
                hue = 4 + ((red - green) / delta);
            }
            hue /= 6;
            if (hue < 0) {
                hue += 1;
            }
            if (hue > 1) {
                hue -= 1;
            }
        }
        return {h: hue, s: saturation, b: brightness};
    };
    var getRGB = function (colour) {
        var htmlcolors = {aliceblue: "#f0f8ff", amethyst: "#96c", antiquewhite: "#faebd7", aqua: "#0ff", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000", blanchedalmond: "#ffebcd", blue: "#00f", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#0ff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgreen: "#006400", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#f0f", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#789", lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#0f0", limegreen: "#32cd32", linen: "#faf0e6", magenta: "#f0f", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23", orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", red: "#f00", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#fff", whitesmoke: "#f5f5f5", yellow: "#ff0", yellowgreen: "#9acd32"};
        if (colour.toString().toLowerCase() in htmlcolors) {
            colour = htmlcolors[colour.toString().toLowerCase()];
        }
        if (!colour) {
            return {r: 0, g: 0, b: 0, hex: "#000"};
        }
        if (colour == "none") {
            return {r: -1, g: -1, b: -1, hex: "none"};
        }
        var red, green, blue,
            rgb = colour.match(/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgb\(\s*([\d\.]+\s*,\s*[\d\.]+\s*,\s*[\d\.]+)\s*\)|rgb\(\s*([\d\.]+%\s*,\s*[\d\.]+%\s*,\s*[\d\.]+%)\s*\)|hsb\(\s*([\d\.]+\s*,\s*[\d\.]+\s*,\s*[\d\.]+)\s*\)|hsb\(\s*([\d\.]+%\s*,\s*[\d\.]+%\s*,\s*[\d\.]+%)\s*\))\s*$/i);
        if (rgb) {
            if (rgb[2]) {
                blue = parseInt(rgb[2].substring(5), 16);
                green = parseInt(rgb[2].substring(3, 5), 16);
                red = parseInt(rgb[2].substring(1, 3), 16);
            }
            if (rgb[3]) {
                blue = parseInt(rgb[3].substring(3) + rgb[3].substring(3), 16);
                green = parseInt(rgb[3].substring(2, 3) + rgb[3].substring(2, 3), 16);
                red = parseInt(rgb[3].substring(1, 2) + rgb[3].substring(1, 2), 16);
            }
            if (rgb[4]) {
                rgb = rgb[4].split(/\s*,\s*/);
                red = parseFloat(rgb[0], 10);
                green = parseFloat(rgb[1], 10);
                blue = parseFloat(rgb[2], 10);
            }
            if (rgb[5]) {
                rgb = rgb[5].split(/\s*,\s*/);
                red = parseFloat(rgb[0], 10) * 2.55;
                green = parseFloat(rgb[1], 10) * 2.55;
                blue = parseFloat(rgb[2], 10) * 2.55;
            }
            if (rgb[6]) {
                rgb = rgb[6].split(/\s*,\s*/);
                red = parseFloat(rgb[0], 10);
                green = parseFloat(rgb[1], 10);
                blue = parseFloat(rgb[2], 10);
                return R.hsb2rgb(red, green, blue);
            }
            if (rgb[7]) {
                rgb = rgb[7].split(/\s*,\s*/);
                red = parseFloat(rgb[0], 10) * 2.55;
                green = parseFloat(rgb[1], 10) * 2.55;
                blue = parseFloat(rgb[2], 10) * 2.55;
                return R.hsb2rgb(red, green, blue);
            }
            var rgb = {r: red, g: green, b: blue};
            var r = Math.round(red).toString(16);
            (r.length == 1) && (r = "0" + r);
            var g = Math.round(green).toString(16);
            (g.length == 1) && (g = "0" + g);
            var b = Math.round(blue).toString(16);
            (b.length == 1) && (b = "0" + b);
            rgb.hex = "#" + r + g + b;
            return rgb;
        } else {
            return {r: -1, g: -1, b: -1, hex: "none"};
        }
    };
    R.getColor = function (value) {
        var start = arguments.callee.start = arguments.callee.start || {h: 0, s: 1, b: value || .75};
        var rgb = this.hsb2rgb(start.h, start.s, start.b);
        start.h += .075;
        if (start.h > 1) {
            start.h = 0;
            start.s -= .2;
            if (start.s <= 0) {
                arguments.callee.start = {h: 0, s: 1, b: start.b};
            }
        }
        return rgb.hex;
    };
    R.getColor.reset = function () {
        delete this.start;
    };
    // path utilities
    R.parsePathString = function (pathString) {
        var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0},
            data = [],
            toString = function () {
                var res = "";
                for (var i = 0, ii = this.length; i < ii; i++) {
                    res += this[i][0] + this[i].join(",").substring(2);
                }
                return res;
            };
        if (pathString.toString.toString() == toString.toString()) {
            return pathString;
        }
        pathString.replace(/([achlmqstvz])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?\s*,?\s*)+)/ig, function (a, b, c) {
            var params = [], name = b.toLowerCase();
            c.replace(/(-?\d*\.?\d*(?:e[-+]?\d+)?)\s*,?\s*/ig, function (a, b) {
                b && params.push(+b);
            });
            while (params.length >= paramCounts[name]) {
                data.push([b].concat(params.splice(0, paramCounts[name])));
                if (!paramCounts[name]) {
                    break;
                };
            }
        });
        data.toString = toString;
        return data;
    };
    var pathDimensions = function (path) {
        var pathArray = path;
        if (typeof path == "string") {
            pathArray = R.parsePathString(path);
        }
        pathArray = pathToAbsolute(pathArray);
        var x = [], y = [], length = 0;
        for (var i = 0, ii = pathArray.length; i < ii; i++) {
            switch (pathArray[i][0]) {
                case "Z":
                    break;
                case "A":
                    x.push(pathArray[i][pathArray[i].length - 2]);
                    y.push(pathArray[i][pathArray[i].length - 1]);
                    break;
                default:
                    for (var j = 1, jj = pathArray[i].length; j < jj; j++) {
                        if (j % 2) {
                            x.push(pathArray[i][j]);
                        } else {
                            y.push(pathArray[i][j]);
                        }
                    }
            }
        }
        var minx = Math.min.apply(Math, x),
            miny = Math.min.apply(Math, y);
        return {
            x: minx,
            y: miny,
            width: Math.max.apply(Math, x) - minx,
            height: Math.max.apply(Math, y) - miny,
            X: x,
            Y: y
        };
    };
    var pathToRelative = function (pathArray) {
        var res = [];
        if (typeof pathArray == "string") {
            pathArray = R.parsePathString(pathArray);
        }
        var x = 0, y = 0, start = 0;
        if (pathArray[0][0] == "M") {
            x = pathArray[0][1];
            y = pathArray[0][2];
            start++;
            res.push(pathArray[0]);
        }
        for (var i = start, ii = pathArray.length; i < ii; i++) {
            res[i] = [];
            if (pathArray[i][0] != pathArray[i][0].toLowerCase()) {
                res[i][0] = pathArray[i][0].toLowerCase();
                switch (res[i][0]) {
                    case "a":
                        res[i][1] = pathArray[i][1];
                        res[i][2] = pathArray[i][2];
                        res[i][3] = 0;
                        res[i][4] = pathArray[i][4];
                        res[i][5] = pathArray[i][5];
                        res[i][6] = +(pathArray[i][6] - x).toFixed(3);
                        res[i][7] = +(pathArray[i][7] - y).toFixed(3);
                        break;
                    case "v":
                        res[i][1] = +(pathArray[i][1] - y).toFixed(3);
                        break;
                    default:
                        for (var j = 1, jj = pathArray[i].length; j < jj; j++) {
                            res[i][j] = +(pathArray[i][j] - ((j % 2) ? x : y)).toFixed(3);
                        }
                }
            } else {
                res[i] = pathArray[i];
            }
            switch (res[i][0]) {
                case "z":
                    break;
                case "h":
                    x += res[i][res[i].length - 1];
                    break;
                case "v":
                    y += res[i][res[i].length - 1];
                    break;
                default:
                    x += res[i][res[i].length - 2];
                    y += res[i][res[i].length - 1];
            }
        }
        res.toString = pathArray.toString;
        return res;
    };
    var pathToAbsolute = function (pathArray) {
        var res = [];
        if (typeof pathArray == "string") {
            pathArray = R.parsePathString(pathArray);
        }
        var x = 0,
            y = 0,
            start = 0;
        if (pathArray[0][0] == "M") {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            start++;
            res[0] = pathArray[0];
        }
        for (var i = start, ii = pathArray.length; i < ii; i++) {
            res[i] = [];
            if (pathArray[i][0] != (pathArray[i][0] + "").toUpperCase()) {
                res[i][0] = (pathArray[i][0] + "").toUpperCase();
                switch (res[i][0]) {
                    case "A":
                        res[i][1] = pathArray[i][1];
                        res[i][2] = pathArray[i][2];
                        res[i][3] = 0;
                        res[i][4] = pathArray[i][4];
                        res[i][5] = pathArray[i][5];
                        res[i][6] = +(pathArray[i][6] + x).toFixed(3);
                        res[i][7] = +(pathArray[i][7] + y).toFixed(3);
                        break;
                    case "V":
                        res[i][1] = +pathArray[i][1] + y;
                        break;
                    default:
                        for (var j = 1, jj = pathArray[i].length; j < jj; j++) {
                            res[i][j] = +pathArray[i][j] + ((j % 2) ? x : y);
                        }
                }
            } else {
                res[i] = pathArray[i];
            }
            switch (res[i][0]) {
                case "Z":
                    break;
                case "H":
                    x = res[i][1];
                    break;
                case "V":
                    y = res[i][1];
                    break;
                default:
                    x = res[i][res[i].length - 2];
                    y = res[i][res[i].length - 1];
            }
        }
        res.toString = pathArray.toString;
        return res;
    };
    var pathEqualiser = function (path1, path2) {
        var data = [pathToAbsolute(R.parsePathString(path1)), pathToAbsolute(R.parsePathString(path2))],
            attrs = [{x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0}, {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0}],
            processPath = function (path, d) {
                if (!path) {
                    return ["U"];
                }
                switch (path[0]) {
                    case "M":
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case "S":
                        var nx = d.x + (d.x - (d.bx || d.x));
                        var ny = d.y + (d.y - (d.by || d.y));
                        path = ["C", nx, ny, path[1], path[2], path[3], path[4]];
                        break;
                    case "T":
                        var nx = d.x + (d.x - (d.bx || d.x));
                        var ny = d.y + (d.y - (d.by || d.y));
                        path = ["Q", nx, ny, path[1], path[2]];
                        break;
                    case "H":
                        path = ["L", path[1], d.y];
                        break;
                    case "V":
                        path = ["L", d.x, path[1]];
                        break;
                    case "Z":
                        path = ["L", d.X, d.Y];
                        break;
                }
                return path;
            },
            edgeCases = function (a, b, i) {
                if (data[a][i][0] == "M" && data[b][i][0] != "M") {
                    data[b].splice(i, 0, ["M", attrs[b].x, attrs[b].y]);
                    attrs[a].bx = data[a][i][data[a][i].length - 4] || 0;
                    attrs[a].by = data[a][i][data[a][i].length - 3] || 0;
                    attrs[a].x = data[a][i][data[a][i].length - 2];
                    attrs[a].y = data[a][i][data[a][i].length - 1];
                    return true;
                } else if (data[a][i][0] == "L" && data[b][i][0] == "C") {
                    data[a][i] = ["C", attrs[a].x, attrs[a].y, data[a][i][1], data[a][i][2], data[a][i][1], data[a][i][2]];
                } else if (data[a][i][0] == "L" && data[b][i][0] == "Q") {
                    data[a][i] = ["Q", data[a][i][1], data[a][i][2], data[a][i][1], data[a][i][2]];
                } else if (data[a][i][0] == "Q" && data[b][i][0] == "C") {
                    var x = data[b][i][data[b][i].length - 2];
                    var y = data[b][i][data[b][i].length - 1];
                    data[b].splice(i + 1, 0, ["Q", x, y, x, y]);
                    data[a].splice(i, 0, ["C", attrs[a].x, attrs[a].y, attrs[a].x, attrs[a].y, attrs[a].x, attrs[a].y]);
                    i++;
                    attrs[b].bx = data[b][i][data[b][i].length - 4] || 0;
                    attrs[b].by = data[b][i][data[b][i].length - 3] || 0;
                    attrs[b].x = data[b][i][data[b][i].length - 2];
                    attrs[b].y = data[b][i][data[b][i].length - 1];
                    return true;
                } else if (data[a][i][0] == "A" && data[b][i][0] == "C") {
                    var x = data[b][i][data[b][i].length - 2];
                    var y = data[b][i][data[b][i].length - 1];
                    data[b].splice(i + 1, 0, ["A", 0, 0, data[a][i][3], data[a][i][4], data[a][i][5], x, y]);
                    data[a].splice(i, 0, ["C", attrs[a].x, attrs[a].y, attrs[a].x, attrs[a].y, attrs[a].x, attrs[a].y]);
                    i++;
                    attrs[b].bx = data[b][i][data[b][i].length - 4] || 0;
                    attrs[b].by = data[b][i][data[b][i].length - 3] || 0;
                    attrs[b].x = data[b][i][data[b][i].length - 2];
                    attrs[b].y = data[b][i][data[b][i].length - 1];
                    return true;
                } else if (data[a][i][0] == "U") {
                    data[a][i][0] = data[b][i][0];
                    for (var j = 1, jj = data[b][i].length; j < jj; j++) {
                        data[a][i][j] = (j % 2) ? attrs[a].x : attrs[a].y;
                    }
                }
                return false;
            };
        for (var i = 0; i < Math.max(data[0].length, data[1].length); i++) {
            data[0][i] = processPath(data[0][i], attrs[0]);
            data[1][i] = processPath(data[1][i], attrs[1]);
            if (data[0][i][0] != data[1][i][0] && (edgeCases(0, 1, i) || edgeCases(1, 0, i))) {
                continue;
            }
            attrs[0].bx = data[0][i][data[0][i].length - 4] || 0;
            attrs[0].by = data[0][i][data[0][i].length - 3] || 0;
            attrs[0].x = data[0][i][data[0][i].length - 2];
            attrs[0].y = data[0][i][data[0][i].length - 1];
            attrs[1].bx = data[1][i][data[1][i].length - 4] || 0;
            attrs[1].by = data[1][i][data[1][i].length - 3] || 0;
            attrs[1].x = data[1][i][data[1][i].length - 2];
            attrs[1].y = data[1][i][data[1][i].length - 1];
        }
        return data;
    };
    var toGradient = function (gradient) {
        if (typeof gradient == "string") {
            gradient = gradient.split(/\s*\-\s*/);
            var angle = gradient.shift();
            if (angle.toLowerCase() == "v") {
                angle = 90;
            } else if (angle.toLowerCase() == "h") {
                angle = 0;
            } else {
                angle = parseFloat(angle, 10);
            }
            angle = -angle;
            var grobj = {angle: angle, type: "linear", dots: [], vector: [0, 0, Math.cos(angle * Math.PI / 180).toFixed(3), Math.sin(angle * Math.PI / 180).toFixed(3)]};
            var max = 1 / (Math.max(Math.abs(grobj.vector[2]), Math.abs(grobj.vector[3])) || 1);
            grobj.vector[2] *= max;
            grobj.vector[3] *= max;
            if (grobj.vector[2] < 0) {
                grobj.vector[0] = -grobj.vector[2];
                grobj.vector[2] = 0;
            }
            if (grobj.vector[3] < 0) {
                grobj.vector[1] = -grobj.vector[3];
                grobj.vector[3] = 0;
            }
            grobj.vector[0] = grobj.vector[0].toFixed(3);
            grobj.vector[1] = grobj.vector[1].toFixed(3);
            grobj.vector[2] = grobj.vector[2].toFixed(3);
            grobj.vector[3] = grobj.vector[3].toFixed(3);
            for (var i = 0, ii = gradient.length; i < ii; i++) {
                var dot = {};
                var par = gradient[i].match(/^([^:]*):?([\d\.]*)/);
                dot.color = getRGB(par[1]).hex;
                par[2] && (dot.offset = par[2] + "%");
                grobj.dots.push(dot);
            }
            for (var i = 1, ii = grobj.dots.length - 1; i < ii; i++) {
                if (!grobj.dots[i].offset) {
                    var start = parseFloat(grobj.dots[i - 1].offset || 0, 10),
                        end = false;
                    for (var j = i + 1; j < ii; j++) {
                        if (grobj.dots[j].offset) {
                            end = grobj.dots[j].offset;
                            break;
                        }
                    }
                    if (!end) {
                        end = 100;
                        j = ii;
                    }
                    end = parseFloat(end, 10);
                    var d = (end - start) / (j - i + 1);
                    for (; i < j; i++) {
                        start += d;
                        grobj.dots[i].offset = start + "%";
                    }
                }
            }
            return grobj;
        } else {
            return gradient;
        }
    };
    var getContainer = function () {
        var container, x, y, width, height;
        if (typeof arguments[0] == "string" || typeof arguments[0] == "object") {
            if (typeof arguments[0] == "string") {
                container = doc.getElementById(arguments[0]);
            } else {
                container = arguments[0];
            }
            if (container.tagName) {
                if (arguments[1] == null) {
                    return {
                        container: container,
                        width: container.style.pixelWidth || container.offsetWidth,
                        height: container.style.pixelHeight || container.offsetHeight
                    };
                } else {
                    return {container: container, width: arguments[1], height: arguments[2]};
                }
            }
        } else if (typeof arguments[0] == "number" && arguments.length > 3) {
            return {container: 1, x: arguments[0], y: arguments[1], width: arguments[2], height: arguments[3]};
        }
    };
    var plugins = function (con, scope, add) {
        for (var prop in add) if (!(prop in con)) {
            switch (typeof add[prop]) {
                case "function":
                    con[prop] = con === scope ? add[prop] : function () { add[prop].apply(scope, arguments); };
                break;
                case "object":
                    con[prop] = {};
                    plugins(con[prop], con, add[prop]);
                break;
                default:
                    con[prop] = add[prop];
                break;
            }
        }
    };

    // SVG
    if (R.svg) {
        var thePath = function (params, pathString, SVG) {
            var el = doc.createElementNS(SVG.svgns, "path");
            el.setAttribute("fill", "none");
            if (SVG.canvas) {
                SVG.canvas.appendChild(el);
            }
            var p = new Element(el, SVG);
            p.isAbsolute = true;
            p.type = "path";
            p.last = {x: 0, y: 0, bx: 0, by: 0};
            p.absolutely = function () {
                this.isAbsolute = true;
                return this;
            };
            p.relatively = function () {
                this.isAbsolute = false;
                return this;
            };
            p.moveTo = function (x, y) {
                var d = this.isAbsolute?"M":"m";
                d += parseFloat(x, 10).toFixed(3) + " " + parseFloat(y, 10).toFixed(3) + " ";
                var oldD = this[0].getAttribute("d") || "";
                (oldD == "M0,0") && (oldD = "");
                this[0].setAttribute("d", oldD + d);
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(x, 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(y, 10);
                this.attrs.path = oldD + d;
                return this;
            };
            p.lineTo = function (x, y) {
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(x, 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(y, 10);
                var d = this.isAbsolute?"L":"l";
                d += parseFloat(x, 10).toFixed(3) + " " + parseFloat(y, 10).toFixed(3) + " ";
                var oldD = this[0].getAttribute("d") || "";
                this[0].setAttribute("d", oldD + d);
                this.attrs.path = oldD + d;
                return this;
            };
            p.arcTo = function (rx, ry, large_arc_flag, sweep_flag, x, y) {
                var d = this.isAbsolute ? "A" : "a";
                d += [parseFloat(rx, 10).toFixed(3), parseFloat(ry, 10).toFixed(3), 0, large_arc_flag, sweep_flag, parseFloat(x, 10).toFixed(3), parseFloat(y, 10).toFixed(3)].join(" ");
                var oldD = this[0].getAttribute("d") || "";
                this[0].setAttribute("d", oldD + d);
                this.last.x = parseFloat(x, 10);
                this.last.y = parseFloat(y, 10);
                this.attrs.path = oldD + d;
                return this;
            };
            p.cplineTo = function (x1, y1, w1) {
                if (!w1) {
                    return this.lineTo(x1, y1);
                } else {
                    var p = {};
                    var x = parseFloat(x1, 10);
                    var y = parseFloat(y1, 10);
                    var w = parseFloat(w1, 10);
                    var d = this.isAbsolute?"C":"c";
                    var attr = [+this.last.x + w, +this.last.y, x - w, y, x, y];
                    for (var i = 0, ii = attr.length; i < ii; i++) {
                        d += attr[i].toFixed(3) + " ";
                    }
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + attr[4];
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + attr[5];
                    this.last.bx = attr[2];
                    this.last.by = attr[3];
                    var oldD = this[0].getAttribute("d") || "";
                    this[0].setAttribute("d", oldD + d);
                    this.attrs.path = oldD + d;
                    return this;
                }
            };
            p.curveTo = function () {
                var p = {},
                    command = [0, 1, 2, 3, "s", 5, "c"];

                var d = command[arguments.length];
                if (this.isAbsolute) {
                    d = d.toUpperCase();
                }
                for (var i = 0, ii = arguments.length; i < ii; i++) {
                    d += parseFloat(arguments[i], 10).toFixed(3) + " ";
                }
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[arguments.length - 2], 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[arguments.length - 1], 10);
                this.last.bx = parseFloat(arguments[arguments.length - 4], 10);
                this.last.by = parseFloat(arguments[arguments.length - 3], 10);
                var oldD = this.node.getAttribute("d") || "";
                this.node.setAttribute("d", oldD + d);
                this.attrs.path = oldD + d;
                return this;
            };
            p.qcurveTo = function () {
                var p = {},
                    command = [0, 1, "t", 3, "q"];

                var d = command[arguments.length];
                if (this.isAbsolute) {
                    d = d.toUpperCase();
                }
                for (var i = 0, ii = arguments.length; i < ii; i++) {
                    d += parseFloat(arguments[i], 10).toFixed(3) + " ";
                }
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[arguments.length - 2], 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[arguments.length - 1], 10);
                if (arguments.length != 2) {
                    this.last.qx = parseFloat(arguments[arguments.length - 4], 10);
                    this.last.qy = parseFloat(arguments[arguments.length - 3], 10);
                }
                var oldD = this.node.getAttribute("d") || "";
                this.node.setAttribute("d", oldD + d);
                this.attrs.path = oldD + d;
                return this;
            };
            p.addRoundedCorner = function (r, dir) {
                var R = .5522 * r, rollback = this.isAbsolute, o = this;
                if (rollback) {
                    this.relatively();
                    rollback = function () {
                        o.absolutely();
                    };
                } else {
                    rollback = function () {};
                }
                var actions = {
                    l: function () {
                        return {
                            u: function () {
                                o.curveTo(-R, 0, -r, -(r - R), -r, -r);
                            },
                            d: function () {
                                o.curveTo(-R, 0, -r, r - R, -r, r);
                            }
                        };
                    },
                    r: function () {
                        return {
                            u: function () {
                                o.curveTo(R, 0, r, -(r - R), r, -r);
                            },
                            d: function () {
                                o.curveTo(R, 0, r, r - R, r, r);
                            }
                        };
                    },
                    u: function () {
                        return {
                            r: function () {
                                o.curveTo(0, -R, -(R - r), -r, r, -r);
                            },
                            l: function () {
                                o.curveTo(0, -R, R - r, -r, -r, -r);
                            }
                        };
                    },
                    d: function () {
                        return {
                            r: function () {
                                o.curveTo(0, R, -(R - r), r, r, r);
                            },
                            l: function () {
                                o.curveTo(0, R, R - r, r, -r, r);
                            }
                        };
                    }
                };
                actions[dir[0]]()[dir[1]]();
                rollback();
                return o;
            };
            p.andClose = function () {
                var oldD = this[0].getAttribute("d") || "";
                this[0].setAttribute("d", oldD + "Z ");
                this.attrs.path = oldD + "Z ";
                return this;
            };
            if (pathString) {
                p.attrs.path = "" + pathString;
                p.absolutely();
                paper.pathfinder(p, p.attrs.path);
            }
            if (params) {
                setFillAndStroke(p, params);
            }
            return p;
        };
        var addGrdientFill = function (o, gradient, SVG) {
            gradient = toGradient(gradient);
            var el = doc.createElementNS(SVG.svgns, (gradient.type || "linear") + "Gradient");
            el.id = "raphael-gradient-" + R.idGenerator++;
            if (gradient.vector && gradient.vector.length) {
                el.setAttribute("x1", gradient.vector[0]);
                el.setAttribute("y1", gradient.vector[1]);
                el.setAttribute("x2", gradient.vector[2]);
                el.setAttribute("y2", gradient.vector[3]);
            }
            SVG.defs.appendChild(el);
            var isopacity = true;
            for (var i = 0, ii = gradient.dots.length; i < ii; i++) {
                var stop = doc.createElementNS(SVG.svgns, "stop");
                if (gradient.dots[i].offset) {
                    isopacity = false;
                }
                stop.setAttribute("offset", gradient.dots[i].offset ? gradient.dots[i].offset : (i == 0) ? "0%" : "100%");
                stop.setAttribute("stop-color", getRGB(gradient.dots[i].color).hex || "#fff");
                // ignoring opacity for internal points, because VML doesn't support it
                el.appendChild(stop);
            };
            if (isopacity && typeof gradient.dots[ii - 1].opacity != "undefined") {
                stop.setAttribute("stop-opacity", gradient.dots[ii - 1].opacity);
            }
            o.setAttribute("fill", "url(#" + el.id + ")");
            o.style.opacity = 1;
            o.style.fillOpacity = 1;
            o.setAttribute("opacity", 1);
            o.setAttribute("fill-opacity", 1);
        };
        var updatePosition = function (o) {
            if (o.pattern) {
                var bbox = o.getBBox();
                o.pattern.setAttribute("patternTransform", "translate(" + [bbox.x, bbox.y].join(",") + ")");
            }
        };
        var setFillAndStroke = function (o, params) {
            var dasharray = {
                "-": [3, 1],
                ".": [1, 1],
                "-.": [3, 1, 1, 1],
                "-..": [3, 1, 1, 1, 1, 1],
                ". ": [1, 3],
                "- ": [4, 3],
                "--": [8, 3],
                "- .": [4, 3, 1, 3],
                "--.": [8, 3, 1, 3],
                "--..": [8, 3, 1, 3, 1, 3]
            },
            addDashes = function (o, value) {
                value = dasharray[value.toString().toLowerCase()];
                if (value) {
                    var width = o.attrs["stroke-width"] || "1",
                        butt = {round: width, square: width, butt: 0}[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                        dashes = [];
                    for (var i = 0, ii = value.length; i < ii; i++) {
                        dashes.push(value[i] * width + ((i % 2) ? 1 : -1) * butt);
                    }
                    value = dashes.join(",");
                    o.node.setAttribute("stroke-dasharray", value);
                }
            };
            for (var att in params) {
                if (!(att in availableAttrs)) {
                    continue;
                }
                var value = params[att];
                o.attrs[att] = value;
                switch (att) {
                    // Hyperlink
                    case "href":
                    case "title":
                    case "target":
                        var pn = o.node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            var hl = doc.createElementNS(o.svg.svgns, "a");
                            pn.insertBefore(hl, o.node);
                            hl.appendChild(o.node);
                            pn = hl;
                        }
                        pn.setAttributeNS(o.svg.xlink, att, value);
                      break;
                    case "path":
                        if (o.type == "path") {
                            o.node.setAttribute("d", "M0,0");
                            paper.pathfinder(o, value);
                        }
                    case "rx":
                    case "cx":
                    case "x":
                        o.node.setAttribute(att, value);
                        updatePosition(o);
                        break;
                    case "ry":
                    case "cy":
                    case "y":
                        o.node.setAttribute(att, value);
                        updatePosition(o);
                        break;
                    case "width":
                        o.node.setAttribute(att, value);
                        break;
                    case "height":
                        o.node.setAttribute(att, value);
                        break;
                    case "src":
                        if (o.type == "image") {
                            o.node.setAttributeNS(o.svg.xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        o.node.style.strokeWidth = value;
                        // Need following line for Firefox
                        o.node.setAttribute(att, value);
                        if (o.attrs["stroke-dasharray"]) {
                            addDashes(o, o.attrs["stroke-dasharray"]);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value);
                        break;
                    case "rotation":
                        o.rotate(value, true);
                        break;
                    case "translation":
                        var xy = (value + "").split(separator);
                        o.translate((+xy[0] + 1 || 2) - 1, (+xy[1] + 1 || 2) - 1);
                        break;
                    case "scale":
                        var xy = (value + "").split(separator);
                        o.scale(+xy[0] || 1, +xy[1] || +xy[0] || 1);
                        break;
                    case "fill":
                        var isURL = value.match(/^url\(([^\)]+)\)$/i);
                        if (isURL) {
                            var el = doc.createElementNS(o.svg.svgns, "pattern");
                            var ig = doc.createElementNS(o.svg.svgns, "image");
                            el.id = "raphael-pattern-" + R.idGenerator++;
                            el.setAttribute("x", 0);
                            el.setAttribute("y", 0);
                            el.setAttribute("patternUnits", "userSpaceOnUse");
                            ig.setAttribute("x", 0);
                            ig.setAttribute("y", 0);
                            ig.setAttributeNS(o.svg.xlink, "href", isURL[1]);
                            el.appendChild(ig);

                            var img = doc.createElement("img");
                            img.style.position = "absolute";
                            img.style.top = "-9999em";
                            img.style.left = "-9999em";
                            img.onload = function () {
                                el.setAttribute("width", this.offsetWidth);
                                el.setAttribute("height", this.offsetHeight);
                                ig.setAttribute("width", this.offsetWidth);
                                ig.setAttribute("height", this.offsetHeight);
                                doc.body.removeChild(this);
                                paper.safari();
                            };
                            doc.body.appendChild(img);
                            img.src = isURL[1];
                            o.svg.defs.appendChild(el);
                            o.node.style.fill = "url(#" + el.id + ")";
                            o.node.setAttribute("fill", "url(#" + el.id + ")");
                            o.pattern = el;
                            updatePosition(o);
                            break;
                        }
                        delete params.gradient;
                        delete o.attrs.gradient;
                        if (typeof o.attrs.opacity != "undefined" && typeof params.opacity == "undefined" ) {
                            o.node.style.opacity = o.attrs.opacity;
                            // Need following line for Firefox
                            o.node.setAttribute("opacity", o.attrs.opacity);
                        }
                        if (typeof o.attrs["fill-opacity"] != "undefined" && typeof params["fill-opacity"] == "undefined" ) {
                            o.node.style.fillOpacity = o.attrs["fill-opacity"];
                            // Need following line for Firefox
                            o.node.setAttribute("fill-opacity", o.attrs["fill-opacity"]);
                        }
                    case "stroke":
                        o.node.style[att] = getRGB(value).hex;
                        // Need following line for Firefox
                        o.node.setAttribute(att, getRGB(value).hex);
                        break;
                    case "gradient":
                        addGrdientFill(o.node, value, o.svg);
                        break;
                    case "opacity":
                    case "fill-opacity":
                        if (o.attrs.gradient) {
                            var gradient = doc.getElementById(o.node.getAttribute("fill").replace(/^url\(#|\)$/g, ""));
                            if (gradient) {
                                var stops = gradient.getElementsByTagName("stop");
                                stops[stops.length - 1].setAttribute("stop-opacity", value);
                            }
                            break;
                        }
                    default :
                        var cssrule = att.replace(/(\-.)/g, function (w) {
                            return w.substring(1).toUpperCase();
                        });
                        o.node.style[cssrule] = value;
                        // Need following line for Firefox
                        o.node.setAttribute(att, value);
                        break;
                }
            }
            tuneText(o, params);
        };
        var leading = 1.2;
        var tuneText = function (element, params) {
            if (element.type != "text" || !("text" in params || "font" in params || "font-size" in params || "x" in params)) {
                return;
            }
            var fontSize = element.node.firstChild ? parseInt(doc.defaultView.getComputedStyle(element.node.firstChild, "").getPropertyValue("font-size"), 10) : 10;
            var height = 0;

            if ("text" in params) {
                while (element.node.firstChild) {
                    element.node.removeChild(element.node.firstChild);
                }
                var texts = (params.text + "").split("\n");
                for (var i = 0, ii = texts.length; i < ii; i++) {
                    var tspan = doc.createElementNS(element.svg.svgns, "tspan");
                    i && tspan.setAttribute("dy", fontSize * leading);
                    i && tspan.setAttribute("x", element.attrs.x);
                    tspan.appendChild(doc.createTextNode(texts[i]));
                    element.node.appendChild(tspan);
                    height += fontSize * leading;
                }
            } else {
                var texts = element.node.getElementsByTagName("tspan");
                for (var i = 0, ii = texts.length; i < ii; i++) {
                    i && texts[i].setAttribute("dy", fontSize * leading);
                    i && texts[i].setAttribute("x", element.attrs.x);
                    height += fontSize * leading;
                }
            }
            height -= fontSize * (leading - 1);
            var dif = height / 2 - fontSize;
            if (dif) {
                element.node.setAttribute("y", element.attrs.y - dif);
            }
        };
        var Element = function (node, svg) {
            var X = 0,
                Y = 0;
            this[0] = node;
            this.node = node;
            this.svg = svg;
            this.attrs = this.attrs || {};
            this.transformations = []; // rotate, translate, scale
            this._ = {
                tx: 0,
                ty: 0,
                rt: {deg: 0, x: 0, y: 0},
                sx: 1,
                sy: 1
            };
        };
        Element.prototype.rotate = function (deg, cx, cy) {
            if (deg == null) {
                return this._.rt.deg;
            }
            var bbox = this.getBBox();
            deg = deg.toString().split(separator);
            if (deg.length - 1) {
                cx = parseFloat(deg[1], 10);
                cy = parseFloat(deg[2], 10);
            }
            deg = parseFloat(deg[0], 10);
            if (cx != null) {
                this._.rt.deg = deg;
            } else {
                this._.rt.deg += deg;
            }
            if (cy == null) {
                cx = null;
            }
            cx = cx == null ? bbox.x + bbox.width / 2 : cx;
            cy = cy == null ? bbox.y + bbox.height / 2 : cy;
            if (this._.rt.deg) {
                this.transformations[0] = ("rotate(" + this._.rt.deg + " " + cx + " " + cy + ")");
            } else {
                this.transformations[0] = "";
            }
            this.node.setAttribute("transform", this.transformations.join(" "));
            return this;
        };
        Element.prototype.hide = function () {
            this.node.style.display = "none";
            return this;
        };
        Element.prototype.show = function () {
            this.node.style.display = "block";
            return this;
        };
        Element.prototype.remove = function () {
            this.node.parentNode.removeChild(this.node);
        };
        Element.prototype.getBBox = function () {
            var bbox = this.node.getBBox();
            if (this.type == "text") {
                var chr0 = this.node.getExtentOfChar(0);
                if (chr0.height > bbox.height) {
                    var chrl = this.node.getExtentOfChar(this.node.getNumberOfChars() - 1);
                    return {
                        x: chr0.x,
                        y: chr0.y,
                        width: chrl.x - chr0.x + chrl.width,
                        height: chr0.height
                    };
                }
            }
            return bbox;
        };
        Element.prototype.attr = function () {
            if (arguments.length == 1 && typeof arguments[0] == "string") {
                if (arguments[0] == "translation") {
                    return this.translate();
                }
                return this.attrs[arguments[0]];
            }
            if (arguments.length == 1 && arguments[0] instanceof Array) {
                var values = {};
                for (var j in arguments[0]) {
                    values[arguments[0][j]] = this.attrs[arguments[0][j]];
                }
                return values;
            }
            if (arguments.length == 2) {
                var params = {};
                params[arguments[0]] = arguments[1];
                setFillAndStroke(this, params);
            } else if (arguments.length == 1 && typeof arguments[0] == "object") {
                setFillAndStroke(this, arguments[0]);
            }
            return this;
        };
        Element.prototype.toFront = function () {
            this.node.parentNode.appendChild(this.node);
            return this;
        };
        Element.prototype.toBack = function () {
            if (this.node.parentNode.firstChild != this.node) {
                this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild);
            }
            return this;
        };
        Element.prototype.insertAfter = function (element) {
            if (element.node.nextSibling) {
                element.node.parentNode.insertBefore(this.node, element.node.nextSibling);
            } else {
                element.node.parentNode.appendChild(this.node);
            }
            return this;
        };
        Element.prototype.insertBefore = function (element) {
            element.node.parentNode.insertBefore(this.node, element.node);
            return this;
        };
        var theCircle = function (svg, x, y, r) {
            var el = doc.createElementNS(svg.svgns, "circle");
            el.setAttribute("cx", x);
            el.setAttribute("cy", y);
            el.setAttribute("r", r);
            el.setAttribute("fill", "none");
            el.setAttribute("stroke", "#000");
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var res = new Element(el, svg);
            res.attrs = res.attrs || {};
            res.attrs.cx = x;
            res.attrs.cy = y;
            res.attrs.r = r;
            res.attrs.stroke = "#000";
            res.type = "circle";
            return res;
        };
        var theRect = function (svg, x, y, w, h, r) {
            var el = doc.createElementNS(svg.svgns, "rect");
            el.setAttribute("x", x);
            el.setAttribute("y", y);
            el.setAttribute("width", w);
            el.setAttribute("height", h);
            if (r) {
                el.setAttribute("rx", r);
                el.setAttribute("ry", r);
            }
            el.setAttribute("fill", "none");
            el.setAttribute("stroke", "#000");
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var res = new Element(el, svg);
            res.attrs = res.attrs || {};
            res.attrs.x = x;
            res.attrs.y = y;
            res.attrs.width = w;
            res.attrs.height = h;
            res.attrs.stroke = "#000";
            if (r) {
                res.attrs.rx = res.attrs.ry = r;
            }
            res.type = "rect";
            return res;
        };
        var theEllipse = function (svg, x, y, rx, ry) {
            var el = doc.createElementNS(svg.svgns, "ellipse");
            el.setAttribute("cx", x);
            el.setAttribute("cy", y);
            el.setAttribute("rx", rx);
            el.setAttribute("ry", ry);
            el.setAttribute("fill", "none");
            el.setAttribute("stroke", "#000");
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var res = new Element(el, svg);
            res.attrs = res.attrs || {};
            res.attrs.cx = x;
            res.attrs.cy = y;
            res.attrs.rx = rx;
            res.attrs.ry = ry;
            res.attrs.stroke = "#000";
            res.type = "ellipse";
            return res;
        };
        var theImage = function (svg, src, x, y, w, h) {
            var el = doc.createElementNS(svg.svgns, "image");
            el.setAttribute("x", x);
            el.setAttribute("y", y);
            el.setAttribute("width", w);
            el.setAttribute("height", h);
            el.setAttribute("preserveAspectRatio", "none");
            el.setAttributeNS(svg.xlink, "href", src);
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var res = new Element(el, svg);
            res.attrs = res.attrs || {};
            res.attrs.x = x;
            res.attrs.y = y;
            res.attrs.width = w;
            res.attrs.height = h;
            res.type = "image";
            return res;
        };
        var theText = function (svg, x, y, text) {
            var el = doc.createElementNS(svg.svgns, "text");
            el.setAttribute("x", x);
            el.setAttribute("y", y);
            el.setAttribute("text-anchor", "middle");
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var res = new Element(el, svg);
            res.attrs = res.attrs || {};
            res.attrs.x = x;
            res.attrs.y = y;
            res.type = "text";
            setFillAndStroke(res, {font: availableAttrs.font, stroke: "none", fill: "#000", text: text});
            return res;
        };
        var theGroup = function (svg) {
            var el = doc.createElementNS(svg.svgns, "g");
            if (svg.canvas) {
                svg.canvas.appendChild(el);
            }
            var i = new Element(el, svg);
            for (var f in svg) {
                if (f[0] != "_" && typeof svg[f] == "function") {
                    i[f] = (function (f) {
                        return function () {
                            var e = svg[f].apply(svg, arguments);
                            el.appendChild(e[0]);
                            return e;
                        };
                    })(f);
                }
            }
            i.type = "group";
            return i;
        };
        var setSize = function (width, height) {
            this.width = width || this.width;
            this.height = height || this.height;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.height);
            return this;
        };
        var create = function () {
            var con = getContainer.apply(null, arguments);
            var container = con.container,
                x = con.x,
                y = con.y,
                width = con.width,
                height = con.height;
            if (!container) {
                throw new Error("SVG container not found.");
            }
            paper.canvas = doc.createElementNS(paper.svgns, "svg");
            paper.canvas.setAttribute("width", width || 320);
            paper.width = width || 320;
            paper.canvas.setAttribute("height", height || 200);
            paper.height = height || 200;
            if (container == 1) {
                doc.body.appendChild(paper.canvas);
                paper.canvas.style.position = "absolute";
                paper.canvas.style.left = x + "px";
                paper.canvas.style.top = y + "px";
            } else {
                if (container.firstChild) {
                    container.insertBefore(paper.canvas, container.firstChild);
                } else {
                    container.appendChild(paper.canvas);
                }
            }
            container = {
                canvas: paper.canvas,
                clear: function () {
                    while (this.canvas.firstChild) {
                        this.canvas.removeChild(this.canvas.firstChild);
                    }
                    this.defs = doc.createElementNS(paper.svgns, "defs");
                    this.canvas.appendChild(this.defs);
                }
            };
            for (var prop in paper) {
                if (prop != "create") {
                    container[prop] = paper[prop];
                }
            }
            plugins(container, container, R.fn);
            container.clear();
            return container;
        };
        paper.remove = function () {
            this.canvas.parentNode.removeChild(this.canvas);
        };
        paper.svgns = "http://www.w3.org/2000/svg";
        paper.xlink = "http://www.w3.org/1999/xlink";
        paper.safari = function () {
            if (navigator.vendor == "Apple Computer, Inc.") {
                var rect = this.rect(-this.width, -this.height, this.width * 3, this.height * 3).attr({stroke: "none"});
                setTimeout(function () {rect.remove();}, 0);
            }
        };
    }

    // VML
    if (R.vml) {
        thePath = function (params, pathString, VML) {
            var g = createNode("group"), gl = g.style;
            gl.position = "absolute";
            gl.left = 0;
            gl.top = 0;
            gl.width = VML.width + "px";
            gl.height = VML.height + "px";
            var el = createNode("shape"), ol = el.style;
            ol.width = VML.width + "px";
            ol.height = VML.height + "px";
            el.path = "";
            if (params["class"]) {
                el.className = "rvml " + params["class"];
            }
            el.coordsize = this.coordsize;
            el.coordorigin = this.coordorigin;
            g.appendChild(el);
            VML.canvas.appendChild(g);
            var p = new Element(el, g, VML);
            p.isAbsolute = true;
            p.type = "path";
            p.path = [];
            p.last = {x: 0, y: 0, bx: 0, by: 0, isAbsolute: true};
            p.Path = "";
            p.absolutely = function () {
                this.isAbsolute = true;
                return this;
            };
            p.relatively = function () {
                this.isAbsolute = false;
                return this;
            };
            p.moveTo = function (x, y) {
                var d = this.isAbsolute?"m":"t";
                d += Math.round(parseFloat(x, 10)) + " " + Math.round(parseFloat(y, 10));
                this.node.path = this.Path += d;
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(x, 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(y, 10);
                this.last.isAbsolute = this.isAbsolute;
                this.attrs.path += (this.isAbsolute ? "M" : "m") + [x, y];
                return this;
            };
            p.lineTo = function (x, y) {
                var d = this.isAbsolute?"l":"r";
                d += Math.round(parseFloat(x, 10)) + " " + Math.round(parseFloat(y, 10));
                this[0].path = this.Path += d;
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(x, 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(y, 10);
                this.last.isAbsolute = this.isAbsolute;
                this.attrs.path += (this.isAbsolute ? "L" : "l") + [x, y];
                return this;
            };
            p.arcTo = function (rx, ry, large_arc_flag, sweep_flag, x2, y2) {
                // for more information of where this math came from visit:
                // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
                x2 = (this.isAbsolute ? 0 : this.last.x) + x2;
                y2 = (this.isAbsolute ? 0 : this.last.y) + y2;
                var x1 = this.last.x,
                    y1 = this.last.y,
                    x = (x1 - x2) / 2,
                    y = (y1 - y2) / 2,
                    k = (large_arc_flag == sweep_flag ? -1 : 1) *
                        Math.sqrt(Math.abs(rx * rx * ry * ry - rx * rx * y * y - ry * ry * x * x) / (rx * rx * y * y + ry * ry * x * x)),
                    cx = k * rx * y / ry + (x1 + x2) / 2,
                    cy = k * -ry * x / rx + (y1 + y2) / 2,
                    d = sweep_flag ? (this.isAbsolute ? "wa" : "wr") : (this.isAbsolute ? "at" : "ar"),
                    left = Math.round(cx - rx),
                    top = Math.round(cy - ry);
                d += [left, top, Math.round(left + rx * 2), Math.round(top + ry * 2), Math.round(x1), Math.round(y1), Math.round(parseFloat(x2, 10)), Math.round(parseFloat(y2, 10))].join(", ");
                this.node.path = this.Path += d;
                this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(x2, 10);
                this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(y2, 10);
                this.last.isAbsolute = this.isAbsolute;
                this.attrs.path += (this.isAbsolute ? "A" : "a") + [rx, ry, 0, large_arc_flag, sweep_flag, x2, y2];
                return this;
            };
            p.cplineTo = function (x1, y1, w1) {
                if (!w1) {
                    return this.lineTo(x1, y1);
                } else {
                    var x = Math.round(Math.round(parseFloat(x1, 10) * 100) / 100),
                        y = Math.round(Math.round(parseFloat(y1, 10) * 100) / 100),
                        w = Math.round(Math.round(parseFloat(w1, 10) * 100) / 100),
                        d = this.isAbsolute ? "c" : "v",
                        attr = [Math.round(this.last.x) + w, Math.round(this.last.y), x - w, y, x, y],
                        svgattr = [this.last.x + w1, this.last.y, x1 - w1, y1, x1, y1];
                    d += attr.join(" ") + " ";
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + attr[4];
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + attr[5];
                    this.last.bx = attr[2];
                    this.last.by = attr[3];
                    this.node.path = this.Path += d;
                    this.attrs.path += (this.isAbsolute ? "C" : "c") + svgattr;
                    return this;
                }
            };
            p.curveTo = function () {
                var d = this.isAbsolute ? "c" : "v";
                if (arguments.length == 6) {
                    this.last.bx = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[2], 10);
                    this.last.by = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[3], 10);
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[4], 10);
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[5], 10);
                    d += [Math.round(parseFloat(arguments[0], 10)),
                         Math.round(parseFloat(arguments[1], 10)),
                         Math.round(parseFloat(arguments[2], 10)),
                         Math.round(parseFloat(arguments[3], 10)),
                         Math.round(parseFloat(arguments[4], 10)),
                         Math.round(parseFloat(arguments[5], 10))].join(" ") + " ";
                    this.last.isAbsolute = this.isAbsolute;
                    this.attrs.path += (this.isAbsolute ? "C" : "c") + Array.prototype.splice.call(arguments, 0, arguments.length);
                }
                if (arguments.length == 4) {
                    var bx = this.last.x * 2 - this.last.bx;
                    var by = this.last.y * 2 - this.last.by;
                    this.last.bx = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[0], 10);
                    this.last.by = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[1], 10);
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[2], 10);
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[3], 10);
                    d += [Math.round(bx), Math.round(by),
                         Math.round(parseFloat(arguments[0], 10)),
                         Math.round(parseFloat(arguments[1], 10)),
                         Math.round(parseFloat(arguments[2], 10)),
                         Math.round(parseFloat(arguments[3], 10))].join(" ") + " ";
                     this.attrs.path += (this.isAbsolute ? "S" : "s") + Array.prototype.splice.call(arguments, 0, arguments.length);
                }
                this.node.path = this.Path += d;
                return this;
            };
            p.qcurveTo = function () {
                var d = "qb";
                if (arguments.length == 4) {
                    this.last.qx = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[0], 10);
                    this.last.qy = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[1], 10);
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[2], 10);
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[3], 10);
                    d += [Math.round(this.last.qx),
                         Math.round(this.last.qy),
                         Math.round(this.last.x),
                         Math.round(this.last.y)].join(" ") + " ";
                    this.last.isAbsolute = this.isAbsolute;
                    this.attrs.path += (this.isAbsolute ? "Q" : "q") + Array.prototype.splice.call(arguments, 0, arguments.length);
                }
                if (arguments.length == 2) {
                    this.last.qx = this.last.x * 2 - this.last.qx;
                    this.last.qy = this.last.y * 2 - this.last.qy;
                    this.last.x = (this.isAbsolute ? 0 : this.last.x) + parseFloat(arguments[2], 10);
                    this.last.y = (this.isAbsolute ? 0 : this.last.y) + parseFloat(arguments[3], 10);
                    d += [Math.round(this.last.qx),
                         Math.round(this.last.qy),
                         Math.round(this.last.x),
                         Math.round(this.last.y)].join(" ") + " ";
                     this.attrs.path += (this.isAbsolute ? "T" : "t") + Array.prototype.splice.call(arguments, 0, arguments.length);
                }
                this.node.path = this.Path += d;
                this.path.push({type: "qcurve", arg: [].slice.call(arguments, 0), pos: this.isAbsolute});
                return this;
            };
            p.addRoundedCorner = function (r, dir) {
                var R = .5522 * r, rollback = this.isAbsolute, o = this;
                if (rollback) {
                    this.relatively();
                    rollback = function () {
                        o.absolutely();
                    };
                } else {
                    rollback = function () {};
                }
                var actions = {
                    l: function () {
                        return {
                            u: function () {
                                o.curveTo(-R, 0, -r, -(r - R), -r, -r);
                            },
                            d: function () {
                                o.curveTo(-R, 0, -r, r - R, -r, r);
                            }
                        };
                    },
                    r: function () {
                        return {
                            u: function () {
                                o.curveTo(R, 0, r, -(r - R), r, -r);
                            },
                            d: function () {
                                o.curveTo(R, 0, r, r - R, r, r);
                            }
                        };
                    },
                    u: function () {
                        return {
                            r: function () {
                                o.curveTo(0, -R, -(R - r), -r, r, -r);
                            },
                            l: function () {
                                o.curveTo(0, -R, R - r, -r, -r, -r);
                            }
                        };
                    },
                    d: function () {
                        return {
                            r: function () {
                                o.curveTo(0, R, -(R - r), r, r, r);
                            },
                            l: function () {
                                o.curveTo(0, R, R - r, r, -r, r);
                            }
                        };
                    }
                };
                actions[dir.charAt(0)]()[dir.charAt(1)]();
                rollback();
                return o;
            };
            p.andClose = function () {
                this.node.path = (this.Path += "x e");
                this.attrs.path += "z";
                return this;
            };
            if (pathString) {
                p.absolutely();
                p.attrs.path = "";
                paper.pathfinder(p, "" + pathString);
            }
            // p.setBox();
            setFillAndStroke(p, params);
            if (params.gradient) {
                addGrdientFill(p, params.gradient);
            }
            return p;
        };
        var setFillAndStroke = function (o, params) {
            var s = o.node.style,
                res = o;
            o.attrs = o.attrs || {};
            for (var par in params) {
                o.attrs[par] = params[par];
            }
            params.href && (o.node.href = params.href);
            params.title && (o.node.title = params.title);
            params.target && (o.node.target = params.target);
            if (params.path && o.type == "path") {
                o.Path = "";
                o.path = [];
                paper.pathfinder(o, params.path);
            }
            if (params.rotation != null) {
                o.rotate(params.rotation, true);
            }
            if (params.translation) {
                var xy = (params.translation + "").split(separator);
                o.translate(xy[0], xy[1]);
            }
            if (params.scale) {
                var xy = (params.scale + "").split(separator);
                o.scale(xy[0], xy[1]);
            }
            if (o.type == "image" && params.src) {
                o.node.src = params.src;
            }
            if (o.type == "image" && params.opacity) {
                o.node.filterOpacity = " progid:DXImageTransform.Microsoft.Alpha(opacity=" + (params.opacity * 100) + ")";
                o.node.style.filter = (o.node.filterMatrix || "") + (o.node.filterOpacity || "");
            }
            params.font && (s.font = params.font);
            params["font-family"] && (s.fontFamily = params["font-family"]);
            params["font-size"] && (s.fontSize = params["font-size"]);
            params["font-weight"] && (s.fontWeight = params["font-weight"]);
            params["font-style"] && (s.fontStyle = params["font-style"]);
            if (typeof params.opacity != "undefined" || typeof params["stroke-width"] != "undefined" || typeof params.fill != "undefined" || typeof params.stroke != "undefined" || params["stroke-width"] || params["stroke-opacity"] || params["fill-opacity"] || params["stroke-dasharray"] || params["stroke-miterlimit"] || params["stroke-linejoin"] || params["stroke-linecap"]) {
                o = o.shape || o.node;
                var fill = (o.getElementsByTagName("fill") && o.getElementsByTagName("fill")[0]) || createNode("fill");
                if ("fill-opacity" in params || "opacity" in params) {
                    fill.opacity = ((+params["fill-opacity"] + 1 || 2) - 1) * ((+params.opacity + 1 || 2) - 1);
                }
                if (params.fill) {
                    fill.on = true;
                }
                if (typeof fill.on == "undefined" || params.fill == "none") {
                    fill.on = false;
                }
                if (fill.on && params.fill) {
                    var isURL = params.fill.match(/^url\(([^\)]+)\)$/i);
                    if (isURL) {
                        fill.src = isURL[1];
                        fill.type = "tile";
                    } else {
                        fill.color = getRGB(params.fill).hex;
                        fill.src = "";
                        fill.type = "solid";
                    }
                }
                o.appendChild(fill);
                var stroke = (o.getElementsByTagName("stroke") && o.getElementsByTagName("stroke")[0]) || createNode("stroke");
                if ((params.stroke && params.stroke != "none") || params["stroke-width"] || typeof params["stroke-opacity"] != "undefined" || params["stroke-dasharray"] || params["stroke-miterlimit"] || params["stroke-linejoin"] || params["stroke-linecap"]) {
                    stroke.on = true;
                }
                if (params.stroke == "none" || typeof stroke.on == "undefined" || params.stroke == 0) {
                    stroke.on = false;
                }
                if (stroke.on && params.stroke) {
                    stroke.color = getRGB(params.stroke).hex;
                }
                stroke.opacity = ((+params["stroke-opacity"] + 1 || 2) - 1) * ((+params.opacity + 1 || 2) - 1);
                params["stroke-linejoin"] && (stroke.joinstyle = params["stroke-linejoin"] || "miter");
                stroke.miterlimit = params["stroke-miterlimit"] || 8;
                params["stroke-linecap"] && (stroke.endcap = {butt: "flat", square: "square", round: "round"}[params["stroke-linecap"]] || "miter");
                params["stroke-width"] && (stroke.weight = (parseFloat(params["stroke-width"], 10) || 1) * 12 / 16);
                if (params["stroke-dasharray"]) {
                    var dasharray = {
                        "-": "shortdash",
                        ".": "shortdot",
                        "-.": "shortdashdot",
                        "-..": "shortdashdotdot",
                        ". ": "dot",
                        "- ": "dash",
                        "--": "longdash",
                        "- .": "dashdot",
                        "--.": "longdashdot",
                        "--..": "longdashdotdot"
                    };
                    stroke.dashstyle = dasharray[params["stroke-dasharray"]] || "";
                }
                o.appendChild(stroke);
            }
            if (res.type == "text") {
                var span = doc.createElement("span"),
                    s = span.style;
                s.padding = 0;
                s.margin = 0;
                s.lineHeight = 1;
                s.display = "inline";
                res.attrs.font && (s.font = res.attrs.font);
                res.attrs["font-family"] && (s.fontFamily = res.attrs["font-family"]);
                res.attrs["font-size"] && (s.fontSize = res.attrs["font-size"]);
                res.attrs["font-weight"] && (s.fontWeight = res.attrs["font-weight"]);
                res.attrs["font-style"] && (s.fontStyle = res.attrs["font-style"]);
                res.node.parentNode.appendChild(span);
                span.innerText = res.node.string;
                res.W = res.attrs.w = span.offsetWidth;
                res.H = res.attrs.h = span.offsetHeight;
                res.X = res.attrs.x;
                res.Y = res.attrs.y + Math.round(res.H / 2);
                res.node.parentNode.removeChild(span);

                // text-anchor emulation
                switch (res.attrs["text-anchor"]) {
                    case "start":
                        res.node.style["v-text-align"] = "left";
                        res.bbx = Math.round(res.W / 2);
                    break;
                    case "end":
                        res.node.style["v-text-align"] = "right";
                        res.bbx = -Math.round(res.W / 2);
                    break;
                    default:
                        res.node.style["v-text-align"] = "center";
                    break;
                }
            }
        };
        var getAngle = function (a, b, c, d) {
            var angle = Math.round(Math.atan((parseFloat(c, 10) - parseFloat(a, 10)) / (parseFloat(d, 10) - parseFloat(b, 10))) * 57.29) || 0;
            if (!angle && parseFloat(a, 10) < parseFloat(b, 10)) {
                angle = 180;
            }
            angle -= 180;
            if (angle < 0) {
                angle += 360;
            }
            return angle;
        };
        var addGrdientFill = function (o, gradient) {
            gradient = toGradient(gradient);
            o.attrs = o.attrs || {};
            var attrs = o.attrs;
            o.attrs.gradient = gradient;
            o = o.shape || o[0];
            var fill = o.getElementsByTagName("fill");
            if (fill.length) {
                fill = fill[0];
            } else {
                fill = createNode("fill");
            }
            if (gradient.dots.length) {
                fill.on = true;
                fill.method = "none";
                fill.type = ((gradient.type + "").toLowerCase() == "radial") ? "gradientTitle" : "gradient";
                if (typeof gradient.dots[0].color != "undefined") {
                    fill.color = getRGB(gradient.dots[0].color).hex;
                }
                if (typeof gradient.dots[gradient.dots.length - 1].color != "undefined") {
                    fill.color2 = getRGB(gradient.dots[gradient.dots.length - 1].color).hex;
                }
                var colors = [];
                for (var i = 0, ii = gradient.dots.length; i < ii; i++) {
                    if (gradient.dots[i].offset) {
                        colors.push(gradient.dots[i].offset + " " + getRGB(gradient.dots[i].color).hex);
                    }
                };
                var fillOpacity = typeof gradient.dots[gradient.dots.length - 1].opacity == "undefined" ? (typeof attrs.opacity == "undefined" ? 1 : attrs.opacity) : gradient.dots[gradient.dots.length - 1].opacity;
                if (colors.length) {
                    fill.colors.value = colors.join(",");
                    fillOpacity = typeof attrs.opacity == "undefined" ? 1 : attrs.opacity;
                } else {
                    fill.colors.value = "0% " + fill.color;
                }
                fill.opacity = fillOpacity;
                if (typeof gradient.angle != "undefined") {
                    fill.angle = (-gradient.angle + 270) % 360;
                } else if (gradient.vector) {
                    fill.angle = getAngle.apply(null, gradient.vector);
                }
                if ((gradient.type + "").toLowerCase() == "radial") {
                    fill.focus = "100%";
                    fill.focusposition = "0.5 0.5";
                }
            }
        };
        var Element = function (node, group, vml) {
            var Rotation = 0,
                RotX = 0,
                RotY = 0,
                Scale = 1;
            this[0] = node;
            this.node = node;
            this.X = 0;
            this.Y = 0;
            this.attrs = {};
            this.Group = group;
            this.vml = vml;
            this._ = {
                tx: 0,
                ty: 0,
                rt: {deg:0},
                sx: 1,
                sy: 1
            };
        };
        Element.prototype.rotate = function (deg, cx, cy) {
            if (deg == null) {
                return this._.rt.deg;
            }
            deg = deg.toString().split(separator);
            if (deg.length - 1) {
                cx = parseFloat(deg[1], 10);
                cy = parseFloat(deg[2], 10);
            }
            deg = parseFloat(deg[0], 10);
            if (cx != null) {
                this._.rt.deg = deg;
            } else {
                this._.rt.deg += deg;
            }
            if (cy == null) {
                cx = null;
            }
            this._.rt.cx = cx;
            this._.rt.cy = cy;
            this.setBox(null, cx, cy);
            this.Group.style.rotation = this._.rt.deg;
            return this;
        };
        Element.prototype.setBox = function (params, cx, cy) {
            var gs = this.Group.style,
                os = (this.shape && this.shape.style) || this.node.style;
            for (var i in params) {
                this.attrs[i] = params[i];
            }
            cx = cx || this._.rt.cx;
            cy = cy || this._.rt.cy;
            var attr = this.attrs, x, y, w, h;
            switch (this.type) {
                case "circle":
                    x = attr.cx - attr.r;
                    y = attr.cy - attr.r;
                    w = h = attr.r * 2;
                    break;
                case "ellipse":
                    x = attr.cx - attr.rx;
                    y = attr.cy - attr.ry;
                    w = attr.rx * 2;
                    h = attr.ry * 2;
                    break;
                case "rect":
                case "image":
                    x = attr.x;
                    y = attr.y;
                    w = attr.width || 0;
                    h = attr.height || 0;
                    break;
                case "text":
                    this.textpath.v = ["m", Math.round(attr.x), ", ", Math.round(attr.y - 2), "l", Math.round(attr.x) + 1, ", ", Math.round(attr.y - 2)].join("");
                    x = attr.x - Math.round(this.W / 2);
                    y = attr.y - this.H / 2;
                    w = this.W;
                    h = this.H;
                    break;
                case "path":
                    if (!this.attrs.path) {
                        x = 0;
                        y = 0;
                        w = this.vml.width;
                        h = this.vml.height;
                    } else {
                        var dim = pathDimensions(this.attrs.path),
                        x = dim.x;
                        y = dim.y;
                        w = dim.width;
                        h = dim.height;
                    }
                    break;
                default:
                    x = 0;
                    y = 0;
                    w = this.vml.width;
                    h = this.vml.height;
                    break;
            }
            cx = (cx == null) ? x + w / 2 : cx;
            cy = (cy == null) ? y + h / 2 : cy;
            var left = cx - this.vml.width / 2,
                top = cy - this.vml.height / 2;
            if (this.type == "path" || this.type == "text") {
                gs.left = left + "px";
                gs.top = top + "px";
                this.X = this.type == "text" ? x : -left;
                this.Y = this.type == "text" ? y : -top;
                this.W = w;
                this.H = h;
                os.left = -left + "px";
                os.top = -top + "px";
            } else {
                gs.left = left + "px";
                gs.top = top + "px";
                this.X = x;
                this.Y = y;
                this.W = w;
                this.H = h;
                gs.width = this.vml.width + "px";
                gs.height = this.vml.height + "px";
                os.left = x - left + "px";
                os.top = y - top + "px";
                os.width = w + "px";
                os.height = h + "px";
            }
        };
        Element.prototype.hide = function () {
            this.Group.style.display = "none";
            return this;
        };
        Element.prototype.show = function () {
            this.Group.style.display = "block";
            return this;
        };
        Element.prototype.getBBox = function () {
            return {
                x: this.X + (this.bbx || 0),
                y: this.Y,
                width: this.W,
                height: this.H
            };
        };
        Element.prototype.remove = function () {
            this[0].parentNode.removeChild(this[0]);
            this.Group.parentNode.removeChild(this.Group);
            this.shape && this.shape.parentNode.removeChild(this.shape);
        };
        Element.prototype.attr = function () {
            if (arguments.length == 1 && typeof arguments[0] == "string") {
                if (arguments[0] == "translation") {
                    return this.translate();
                }
                return this.attrs[arguments[0]];
            }
            if (this.attrs && arguments.length == 1 && arguments[0] instanceof Array) {
                var values = {};
                for (var i = 0, ii = arguments[0].length; i < ii; i++) {
                    values[arguments[0][i]] = this.attrs[arguments[0][i]];
                };
                return values;
            }
            var params;
            if (arguments.length == 2) {
                params = {};
                params[arguments[0]] = arguments[1];
            }
            if (arguments.length == 1 && typeof arguments[0] == "object") {
                params = arguments[0];
            }
            if (params) {
                if (params.gradient) {
                    addGrdientFill(this, params.gradient);
                }
                if (params.text && this.type == "text") {
                    this.node.string = params.text;
                }
                if (params.id) {
                    this.node.id = params.id;
                }
                setFillAndStroke(this, params);
                this.setBox(params);
            }
            return this;
        };
        Element.prototype.toFront = function () {
            this.Group.parentNode.appendChild(this.Group);
            return this;
        };
        Element.prototype.toBack = function () {
            if (this.Group.parentNode.firstChild != this.Group) {
                this.Group.parentNode.insertBefore(this.Group, this.Group.parentNode.firstChild);
            }
            return this;
        };
        Element.prototype.insertAfter = function (element) {
            if (element.Group.nextSibling) {
                element.Group.parentNode.insertBefore(this.Group, element.Group.nextSibling);
            } else {
                element.Group.parentNode.appendChild(this.Group);
            }
            return this;
        };
        Element.prototype.insertBefore = function (element) {
            element.Group.parentNode.insertBefore(this.Group, element.Group);
            return this;
        };
        var theCircle = function (vml, x, y, r) {
            var g = createNode("group");
            var o = createNode("oval");
            g.appendChild(o);
            vml.canvas.appendChild(g);
            var res = new Element(o, g, vml);
            res.type = "circle";
            setFillAndStroke(res, {stroke: "#000", fill: "none"});
            res.attrs.cx = x;
            res.attrs.cy = y;
            res.attrs.r = r;
            res.setBox({x: x - r, y: y - r, width: r * 2, height: r * 2});
            return res;
        };
        var theRect = function (vml, x, y, w, h, r) {
            var g = createNode("group");
            var o = createNode(r ? "roundrect" : "rect");
            if (r) {
                o.arcsize = r / (Math.min(w, h));
            }
            g.appendChild(o);
            vml.canvas.appendChild(g);
            var res = new Element(o, g, vml);
            res.type = "rect";
            setFillAndStroke(res, {stroke: "#000"});
            res.attrs.x = x;
            res.attrs.y = y;
            res.attrs.w = w;
            res.attrs.h = h;
            res.attrs.r = r;
            res.setBox({x: x, y: y, width: w, height: h});
            return res;
        };
        var theEllipse = function (vml, x, y, rx, ry) {
            var g = createNode("group");
            var o = createNode("oval");
            g.appendChild(o);
            vml.canvas.appendChild(g);
            var res = new Element(o, g, vml);
            res.type = "ellipse";
            setFillAndStroke(res, {stroke: "#000"});
            res.attrs.cx = x;
            res.attrs.cy = y;
            res.attrs.rx = rx;
            res.attrs.ry = ry;
            res.setBox({x: x - rx, y: y - ry, width: rx * 2, height: ry * 2});
            return res;
        };
        var theImage = function (vml, src, x, y, w, h) {
            var g = createNode("group");
            var o = createNode("image");
            o.src = src;
            g.appendChild(o);
            vml.canvas.appendChild(g);
            var res = new Element(o, g, vml);
            res.type = "image";
            res.attrs.x = x;
            res.attrs.y = y;
            res.attrs.w = w;
            res.attrs.h = h;
            res.setBox({x: x, y: y, width: w, height: h});
            return res;
        };
        var theText = function (vml, x, y, text) {
            var g = createNode("group"), gs = g.style;
            var el = createNode("shape"), ol = el.style;
            var path = createNode("path"), ps = path.style;
            path.v = ["m", Math.round(x), ", ", Math.round(y - 2), "l", Math.round(x) + 1, ", ", Math.round(y - 2)].join("");
            path.textpathok = true;
            ol.width = vml.width;
            ol.height = vml.height;
            gs.position = "absolute";
            gs.left = 0;
            gs.top = 0;
            gs.width = vml.width;
            gs.height = vml.height;
            var o = createNode("textpath");
            o.string = text;
            o.on = true;
            o.coordsize = vml.coordsize;
            o.coordorigin = vml.coordorigin;
            el.appendChild(o);
            el.appendChild(path);
            g.appendChild(el);
            vml.canvas.appendChild(g);
            var res = new Element(o, g, vml);
            res.shape = el;
            res.textpath = path;
            res.type = "text";
            res.attrs.x = x;
            res.attrs.y = y;
            res.attrs.w = 1;
            res.attrs.h = 1;
            setFillAndStroke(res, {font: availableAttrs.font, stroke: "none", fill: "#000"});
            res.setBox();
            return res;
        };
        var setSize = function (width, height) {
            this.width = width || this.width;
            this.height = height || this.height;
            this.canvas.style.width = this.width + "px";
            this.canvas.style.height = this.height + "px";
            this.canvas.parentNode.style.clip = "rect(0 " + this.width + " " + this.height + " 0)";
            this.canvas.coordsize = this.width + " " + this.height;
            return this;
        };
        doc.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
        try {
            if (!doc.namespaces.rvml) {
                doc.namespaces.add("rvml","urn:schemas-microsoft-com:vml");
            }
            var createNode = function (tagName) {
                return doc.createElement('<rvml:' + tagName + ' class="rvml">');
            };
        } catch (e) {
            var createNode = function (tagName) {
                return doc.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
            };
        }
        var create = function () {
            var con = getContainer.apply(null, arguments);
            var container = con.container,
                x = con.x,
                y = con.y,
                width = con.width,
                height = con.height;
            if (!container) {
                throw new Error("VML container not found.");
            }
            var c = doc.createElement("div"),
                d = doc.createElement("div"),
                r = paper.canvas = createNode("group"),
                cs = c.style, rs = r.style;
            paper.width = width;
            paper.height = height;
            width = width || "320px";
            height = height || "200px";
            cs.clip = "rect(0 " + width + "px " + height + "px 0)";
            cs.top = "-2px";
            cs.left = "-2px";
            cs.position = "absolute";
            rs.position = "absolute";
            d.style.position = "relative";
            rs.width  = width;
            rs.height = height;
            r.coordsize = (/%$/.test(width) ? width : parseFloat(width, 10)) + " " + (/%$/.test(height) ? height : parseFloat(height, 10));
            r.coordorigin = "0 0";

            var b = createNode("rect"), bs = b.style;
            bs.left = bs.top = 0;
            bs.width  = rs.width;
            bs.height = rs.height;
            b.filled = b.stroked = "f";

            r.appendChild(b);
            c.appendChild(r);
            d.appendChild(c);
            if (container == 1) {
                doc.body.appendChild(d);
                cs.position = "absolute";
                cs.left = x + "px";
                cs.top = y + "px";
                cs.width = width;
                cs.height = height;
                container = {
                    style: {
                        width: width,
                        height: height
                    }
                };
            } else {
                cs.width = container.style.width = width;
                cs.height = container.style.height = height;
                if (container.firstChild) {
                    container.insertBefore(d, container.firstChild);
                } else {
                    container.appendChild(d);
                }
            }
            for (var prop in paper) {
                container[prop] = paper[prop];
            }
            plugins(container, container, R.fn);
            container.clear = function () {
                var todel = [];
                for (var i = 0, ii = r.childNodes.length; i < ii; i++) {
                    if (r.childNodes[i] != b) {
                        todel.push(r.childNodes[i]);
                    }
                }
                for (i = 0, ii = todel.length; i < ii; i++) {
                    r.removeChild(todel[i]);
                }
            };
            return container;
        };
        paper.remove = function () {
            this.canvas.parentNode.parentNode.parentNode.removeChild(this.canvas.parentNode.parentNode);
        };
        paper.safari = function () {};
    }

    // rest

    // Events
    var addEvent = (function () {
        if (doc.addEventListener) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    return fn.call(element, e);
                };
                obj.addEventListener(type, f, false);
                return function () {
                    obj.removeEventListener(type, f, false);
                    return true;
                };
            };
        } else if (doc.attachEvent) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    return fn.call(element, e || win.event);
                };
                obj.attachEvent("on" + type, f);
                var detacher = function () {
                    obj.detachEvent("on" + type, f);
                    return true;
                };
                if (type == "mouseover") {
                    obj.attachEvent("onmouseenter", f);
                    return function () {
                        obj.detachEvent("onmouseenter", f);
                        return detacher();
                    };
                } else if (type == "mouseout") {
                    obj.attachEvent("onmouseleave", f);
                    return function () {
                        obj.detachEvent("onmouseleave", f);
                        return detacher();
                    };
                }
                return detacher;
            };
        }
    })();
    for (var i = events.length; i--;) {
        (function (eventName) {
            Element.prototype[eventName] = function (fn) {
                if (typeof fn == "function") {
                    this.events = this.events || {};
                    this.events[eventName] = this.events[eventName] || {};
                    this.events[eventName][fn] = this.events[eventName][fn] || [];
                    this.events[eventName][fn].push(addEvent(this.shape || this.node, eventName, fn, this));
                }
                return this;
            };
            Element.prototype["un" + eventName] = function (fn) {
                this.events &&
                this.events[eventName] &&
                this.events[eventName][fn] &&
                this.events[eventName][fn].length &&
                this.events[eventName][fn].shift()() &&
                !this.events[eventName][fn].length &&
                delete this.events[eventName][fn];
            };

        })(events[i]);
    }
    paper.circle = function (x, y, r) {
        return theCircle(this, x, y, r);
    };
    paper.rect = function (x, y, w, h, r) {
        return theRect(this, x, y, w, h, r);
    };
    paper.ellipse = function (x, y, rx, ry) {
        return theEllipse(this, x, y, rx, ry);
    };
    paper.path = function (params, pathString) {
        return thePath(params, pathString, this);
    };
    paper.image = function (src, x, y, w, h) {
        return theImage(this, src, x, y, w, h);
    };
    paper.text = function (x, y, text) {
        return theText(this, x, y, text);
    };
    paper.group = function () {
        return this;
    };
    paper.drawGrid = function (x, y, w, h, wv, hv, color) {
        color = color || "#000";
        var path = ["M", x, y, "L", x + w, y, x + w, y + h, x, y + h, x, y],
            rowHeight = h / hv,
            columnWidth = w / wv;
        for (var i = 1; i < hv; i++) {
            path = path.concat(["M", x, y + i * rowHeight, "L", x + w, y + i * rowHeight]);
        }
        for (var i = 1; i < wv; i++) {
            path = path.concat(["M", x + i * columnWidth, y, "L", x + i * columnWidth, y + h]);
        }
        return this.path({stroke: color, "stroke-width": 1}, path.join(","));
    };
    paper.pathfinder = function (p, path) {
        var commands = {
            M: function (x, y) {
                this.moveTo(x, y);
            },
            C: function (x1, y1, x2, y2, x3, y3) {
                this.curveTo(x1, y1, x2, y2, x3, y3);
            },
            Q: function (x1, y1, x2, y2) {
                this.qcurveTo(x1, y1, x2, y2);
            },
            T: function (x, y) {
                this.qcurveTo(x, y);
            },
            S: function (x1, y1, x2, y2) {
                p.curveTo(x1, y1, x2, y2);
            },
            L: function (x, y) {
                p.lineTo(x, y);
            },
            H: function (x) {
                this.lineTo(x, this.last.y);
            },
            V: function (y) {
                this.lineTo(this.last.x, y);
            },
            A: function (rx, ry, xaxisrotation, largearcflag, sweepflag, x, y) {
                this.arcTo(rx, ry, largearcflag, sweepflag, x, y);
            },
            Z: function () {
                this.andClose();
            }
        };

        path = pathToAbsolute(path);
        for (var i = 0, ii = path.length; i < ii; i++) {
            var b = path[i].shift();
            commands[b].apply(p, path[i]);
        }
    };
    paper.set = function (itemsArray) {
        return new Set(itemsArray);
    };
    paper.setSize = setSize;
    Element.prototype.stop = function () {
        clearTimeout(this.animation_in_progress);
    };
    Element.prototype.scale = function (x, y) {
        if (x == null && y == null) {
            return {x: this._.sx, y: this._.sy};
        }
        y = y || x;
        // following line is for IE, apparently NaN is not always falsy
        isNaN(y) && (y = x);
        var dx, dy, cx, cy;
        if (x != 0) {
            var dirx = Math.round(x / Math.abs(x)),
                diry = Math.round(y / Math.abs(y)),
                s = this.node.style;
            dx = this.attr("x");
            dy = this.attr("y");
            cx = this.attr("cx");
            cy = this.attr("cy");
            if (dirx != 1 || diry != 1) {
                if (this.transformations) {
                    this.transformations[2] = "scale(" + [dirx, diry] + ")";
                    this.node.setAttribute("transform", this.transformations.join(" "));
                    dx = (dirx < 0) ? -this.attr("x") - this.attrs.width * x * dirx / this._.sx : this.attr("x");
                    dy = (diry < 0) ? -this.attr("y") - this.attrs.height * y * diry / this._.sy : this.attr("y");
                    cx = this.attr("cx") * dirx;
                    cy = this.attr("cy") * diry;
                } else {
                    this.node.filterMatrix = " progid:DXImageTransform.Microsoft.Matrix(M11=" + dirx +
                        ", M12=0, M21=0, M22=" + diry +
                        ", Dx=0, Dy=0, sizingmethod='auto expand', filtertype='bilinear')";
                    s.filter = (this.node.filterMatrix || "") + (this.node.filterOpacity || "");
                }
            } else {
                if (this.transformations) {
                    this.transformations[2] = "";
                    this.node.setAttribute("transform", this.transformations.join(" "));
                } else {
                    this.node.filterMatrix = "";
                    s.filter = (this.node.filterMatrix || "") + (this.node.filterOpacity || "");
                }
            }
            switch (this.type) {
                case "rect":
                case "image":
                    this.attr({
                        width: this.attrs.width * x * dirx / this._.sx,
                        height: this.attrs.height * y * diry / this._.sy,
                        x: dx,
                        y: dy
                    });
                    break;
                case "circle":
                case "ellipse":
                    this.attr({
                        rx: this.attrs.rx * x * dirx / this._.sx,
                        ry: this.attrs.ry * y * diry / this._.sy,
                        r: this.attrs.r * x * diry / this._.sx,
                        cx: cx,
                        cy: cy
                    });
                    break;
                case "path":
                    var path = pathToRelative(R.parsePathString(this.attr("path"))),
                        skip = true,
                        dim = pathDimensions(this.attrs.path);
                    for (var i = 0, ii = path.length; i < ii; i++) {
                        if (path[i][0].toUpperCase() == "M" && skip) {
                            continue;
                        } else {
                            skip = false;
                        }
                        if (this.svg && path[i][0].toUpperCase() == "A") {
                            path[i][path[i].length - 2] *= x * dirx;
                            path[i][path[i].length - 1] *= y * diry;
                            path[i][1] *= x;
                            path[i][2] *= y;
                        } else {
                            for (var j = 1, jj = path[i].length; j < jj; j++) {
                                path[i][j] *= (j % 2) ? x * dirx / this._.sx : y * diry / this._.sy;
                            }
                        }
                    }
                    var dim2 = pathDimensions(path),
                        dx = dim.x + dim.width / 2 - dim2.x - dim2.width / 2,
                        dy = dim.y + dim.height / 2 - dim2.y - dim2.height / 2;
                    path = pathToRelative(path);
                    path[0][1] += dx;
                    path[0][2] += dy;

                    this.attr({path: path.join(" ")});
            }
        }
        this._.sx = x;
        this._.sy = y;
        return this;
    };
    Element.prototype.animate = function (params, ms, callback) {
        clearTimeout(this.animation_in_progress);
        var from = {},
            to = {},
            diff = {},
            t = {x: 0, y: 0};
        for (var attr in params) {
            if (attr in availableAnimAttrs) {
                from[attr] = this.attr(attr);
                if (typeof from[attr] == "undefined") {
                    from[attr] = availableAttrs[attr];
                }
                to[attr] = params[attr];
                switch (availableAnimAttrs[attr]) {
                    case "number":
                        diff[attr] = (to[attr] - from[attr]) / ms;
                        break;
                    case "colour":
                        from[attr] = getRGB(from[attr]);
                        var toColour = getRGB(to[attr]);
                        diff[attr] = {
                            r: (toColour.r - from[attr].r) / ms,
                            g: (toColour.g - from[attr].g) / ms,
                            b: (toColour.b - from[attr].b) / ms
                        };
                        break;
                    case "path":
                        var pathes = pathEqualiser(from[attr], to[attr]);
                        from[attr] = pathes[0];
                        to[attr] = pathes[1];
                        diff[attr] = [];
                        for (var i = 0, ii = from[attr].length; i < ii; i++) {
                            diff[attr][i] = [0];
                            for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                diff[attr][i][j] = (to[attr][i][j] - from[attr][i][j]) / ms;
                            }
                        }
                        break;
                    case "csv":
                        var values = params[attr].toString().split(separator),
                            from2 = from[attr].toString().split(separator);
                        if (attr == "translation") {
                            from[attr] = [0, 0];
                            diff[attr] = [values[0] / ms, values[1] / ms];
                        } else if (attr == "rotation") {
                            from[attr] = (from2[1] == values[1] && from2[2] == values[2]) ? from2 : [0, values[1], values[2]];
                            diff[attr] = [(values[0] - from[attr][0]) / ms, 0, 0];
                        } else {
                            from[attr] = (from[attr] + "").split(separator);
                            diff[attr] = [(values[0] - from[attr][0]) / ms, (values[1] - from[attr][0]) / ms];
                        }
                        to[attr] = values;
                }
            }
        }
        var start = new Date(),
            prev = 0,
            that = this;
        (function () {
            var time = (new Date()).getTime() - start.getTime(),
                set = {},
                now;
            if (time < ms) {
                for (var attr in from) {
                    switch (availableAnimAttrs[attr]) {
                        case "number":
                            now = +from[attr] + time * diff[attr];
                            break;
                        case "colour":
                            now = "rgb(" + [
                                Math.round(from[attr].r + time * diff[attr].r),
                                Math.round(from[attr].g + time * diff[attr].g),
                                Math.round(from[attr].b + time * diff[attr].b)
                            ].join(",") + ")";
                            break;
                        case "path":
                            now = [];
                            for (var i = 0, ii = from[attr].length; i < ii; i++) {
                                now[i] = [from[attr][i][0]];
                                for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                    now[i][j] = from[attr][i][j] + time * diff[attr][i][j];
                                }
                                now[i] = now[i].join(" ");
                            }
                            now = now.join(" ");
                            break;
                        case "csv":
                            if (attr == "translation") {
                                var x = diff[attr][0] * (time - prev),
                                    y = diff[attr][1] * (time - prev);
                                t.x += x;
                                t.y += y;
                                now = [x, y].join(" ");
                            } else if (attr == "rotation") {
                                now = +from[attr][0] + time * diff[attr][0];
                                from[attr][1] && (now += "," + from[attr][1] + "," + from[attr][2]);
                            } else {
                                now = [+from[attr][0] + time * diff[attr][0], +from[attr][1] + time * diff[attr][1]].join(" ");
                            }
                            break;
                    }
                    if (attr == "font-size") {
                        set[attr] = now + "px";
                    } else {
                        set[attr] = now;
                    }
                }
                that.attr(set);
                that.animation_in_progress = setTimeout(arguments.callee, 0);
                paper.safari();
            } else {
                (t.x || t.y) && that.translate(-t.x, -t.y);
                that.attr(params);
                clearTimeout(that.animation_in_progress);
                paper.safari();
                (typeof callback == "function") && callback.call(that);
            }
            prev = time;
        })();
        return this;
    };
    Element.prototype.translate = function (x, y) {
        if (x == null) {
            return {x: this._.tx, y: this._.ty};
        }
        this._.tx += +x;
        this._.ty += +y;
        switch (this.type) {
            case "circle":
            case "ellipse":
                this.attr({cx: this.attrs.cx + x, cy: this.attrs.cy + y});
                break;
            case "rect":
            case "image":
            case "text":
                this.attr({x: this.attrs.x + +x, y: this.attrs.y + +y});
                break;
            case "path":
                var path = pathToRelative(this.attrs.path);
                path[0][1] += +x;
                path[0][2] += +y;
                this.attr({path: path.join(" ")});
            break;
        }
        return this;
    };

    // Set
    var Set = function (itemsArray) {
        this.items = [];
        this.length = (itemsArray && itemsArray.length) || 0;
        if (itemsArray && itemsArray.constructor == Array) {
            for (var i = itemsArray.length; i--;) {
                if (itemsArray[i].constructor == Element) {
                    this.items[this.items.length] = itemsArray[i];
                }
            }
        }
    };
    Set.prototype.push = function (item) {
        if (item && item.constructor == Element) {
            var len = this.items.length;
            this.items[len] = item;
            this[len] = item;
            this.length++;
        }
        return this;
    };
    Set.prototype.pull = function (id) {
        var res = this.items.splice(id, 1)[0];
        for (var j = id, jj = this.items.length; j < jj; j++) {
            this[j] = this[j + 1];
        }
        delete this[jj + 1];
        this.length--;
        return res;
    };
    for (var method in Element.prototype) {
        Set.prototype[method] = (function (methodname) {
            return function () {
                for (var i = this.items.length; i--;) {
                    this.items[i][methodname].apply(this.items[i], arguments);
                }
                return this;
            };
        })(method);
    }
    Set.prototype.getBBox = function () {
        var x = [], y = [], w = [], h = [];
        for (var i = this.items.length; i--;) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            w.push(box.x + box.width);
            h.push(box.y + box.height);
        }
        x = Math.min.apply(Math, x);
        y = Math.min.apply(Math, y);
        return {
            x: x,
            y: y,
            width: Math.max.apply(Math, w) - x,
            height: Math.max.apply(Math, h) - y
        };
    };

    R.noConflict = function () {
        var r = window.Raphael;
        delete window.Raphael;
        return r;
    };
    return R;
})();(function($){
	var initLayout = function() {
		var hash = window.location.hash.replace('#', '');
		var currentTab = $('ul.navigationTabs a')
							.bind('click', showTab)
							.filter('a[rel=' + hash + ']');
		if (currentTab.size() == 0) {
			currentTab = $('ul.navigationTabs a:first');
		}
		showTab.apply(currentTab.get(0));
		$('#colorpickerHolder').ColorPicker({flat: true});
		$('#colorpickerHolder2').ColorPicker({
			flat: true,
			color: '#00ff00',
			onSubmit: function(hsb, hex, rgb) {
				$('#colorSelector2 div').css('backgroundColor', '#' + hex);
			}
		});
		$('#colorpickerHolder2>div').css('position', 'absolute');
		var widt = false;
		$('#colorSelector2').bind('click', function() {
			$('#colorpickerHolder2').stop().animate({height: widt ? 0 : 173}, 500);
			widt = !widt;
		});
		$('#colorpickerField1, #colorpickerField2, #colorpickerField3').ColorPicker({
			onSubmit: function(hsb, hex, rgb, el) {
				$(el).val(hex);
				$(el).ColorPickerHide();
			},
			onBeforeShow: function () {
				$(this).ColorPickerSetColor(this.value);
			}
		})
		.bind('keyup', function(){
			$(this).ColorPickerSetColor(this.value);
		});
		$('#colorSelector').ColorPicker({
			color: '#0000ff',
			onShow: function (colpkr) {
				$(colpkr).fadeIn(500);
				return false;
			},
			onHide: function (colpkr) {
				$(colpkr).fadeOut(500);
				return false;
			},
			onChange: function (hsb, hex, rgb) {
				$('#colorSelector div').css('backgroundColor', '#' + hex);
			}
		});
	};
	
	var showTab = function(e) {
		var tabIndex = $('ul.navigationTabs a')
							.removeClass('active')
							.index(this);
		$(this)
			.addClass('active')
			.blur();
		$('div.tab')
			.hide()
				.eq(tabIndex)
				.show();
	};
	
	EYE.register(initLayout, 'init');
})(jQuery)/**
 *
 * Utilities
 * Author: Stefan Petre www.eyecon.ro
 * 
 */
(function($) {
EYE.extend({
	getPosition : function(e, forceIt)
	{
		var x = 0;
		var y = 0;
		var es = e.style;
		var restoreStyles = false;
		if (forceIt && jQuery.curCSS(e,'display') == 'none') {
			var oldVisibility = es.visibility;
			var oldPosition = es.position;
			restoreStyles = true;
			es.visibility = 'hidden';
			es.display = 'block';
			es.position = 'absolute';
		}
		var el = e;
		if (el.getBoundingClientRect) { // IE
			var box = el.getBoundingClientRect();
			x = box.left + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft) - 2;
			y = box.top + Math.max(document.documentElement.scrollTop, document.body.scrollTop) - 2;
		} else {
			x = el.offsetLeft;
			y = el.offsetTop;
			el = el.offsetParent;
			if (e != el) {
				while (el) {
					x += el.offsetLeft;
					y += el.offsetTop;
					el = el.offsetParent;
				}
			}
			if (jQuery.browser.safari && jQuery.curCSS(e, 'position') == 'absolute' ) {
				x -= document.body.offsetLeft;
				y -= document.body.offsetTop;
			}
			el = e.parentNode;
			while (el && el.tagName.toUpperCase() != 'BODY' && el.tagName.toUpperCase() != 'HTML') 
			{
				if (jQuery.curCSS(el, 'display') != 'inline') {
					x -= el.scrollLeft;
					y -= el.scrollTop;
				}
				el = el.parentNode;
			}
		}
		if (restoreStyles == true) {
			es.display = 'none';
			es.position = oldPosition;
			es.visibility = oldVisibility;
		}
		return {x:x, y:y};
	},
	getSize : function(e)
	{
		var w = parseInt(jQuery.curCSS(e,'width'), 10);
		var h = parseInt(jQuery.curCSS(e,'height'), 10);
		var wb = 0;
		var hb = 0;
		if (jQuery.curCSS(e, 'display') != 'none') {
			wb = e.offsetWidth;
			hb = e.offsetHeight;
		} else {
			var es = e.style;
			var oldVisibility = es.visibility;
			var oldPosition = es.position;
			es.visibility = 'hidden';
			es.display = 'block';
			es.position = 'absolute';
			wb = e.offsetWidth;
			hb = e.offsetHeight;
			es.display = 'none';
			es.position = oldPosition;
			es.visibility = oldVisibility;
		}
		return {w:w, h:h, wb:wb, hb:hb};
	},
	getClient : function(e)
	{
		var h, w;
		if (e) {
			w = e.clientWidth;
			h = e.clientHeight;
		} else {
			var de = document.documentElement;
			w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
			h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
		}
		return {w:w,h:h};
	},
	getScroll : function (e)
	{
		var t=0, l=0, w=0, h=0, iw=0, ih=0;
		if (e && e.nodeName.toLowerCase() != 'body') {
			t = e.scrollTop;
			l = e.scrollLeft;
			w = e.scrollWidth;
			h = e.scrollHeight;
		} else  {
			if (document.documentElement) {
				t = document.documentElement.scrollTop;
				l = document.documentElement.scrollLeft;
				w = document.documentElement.scrollWidth;
				h = document.documentElement.scrollHeight;
			} else if (document.body) {
				t = document.body.scrollTop;
				l = document.body.scrollLeft;
				w = document.body.scrollWidth;
				h = document.body.scrollHeight;
			}
			if (typeof pageYOffset != 'undefined') {
				t = pageYOffset;
				l = pageXOffset;
			}
			iw = self.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0;
			ih = self.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0;
		}
		return { t: t, l: l, w: w, h: h, iw: iw, ih: ih };
	},
	getMargins : function(e, toInteger)
	{
		var t = jQuery.curCSS(e,'marginTop') || '';
		var r = jQuery.curCSS(e,'marginRight') || '';
		var b = jQuery.curCSS(e,'marginBottom') || '';
		var l = jQuery.curCSS(e,'marginLeft') || '';
		if (toInteger)
			return {
				t: parseInt(t, 10)||0,
				r: parseInt(r, 10)||0,
				b: parseInt(b, 10)||0,
				l: parseInt(l, 10)
			};
		else
			return {t: t, r: r,	b: b, l: l};
	},
	getPadding : function(e, toInteger)
	{
		var t = jQuery.curCSS(e,'paddingTop') || '';
		var r = jQuery.curCSS(e,'paddingRight') || '';
		var b = jQuery.curCSS(e,'paddingBottom') || '';
		var l = jQuery.curCSS(e,'paddingLeft') || '';
		if (toInteger)
			return {
				t: parseInt(t, 10)||0,
				r: parseInt(r, 10)||0,
				b: parseInt(b, 10)||0,
				l: parseInt(l, 10)
			};
		else
			return {t: t, r: r,	b: b, l: l};
	},
	getBorder : function(e, toInteger)
	{
		var t = jQuery.curCSS(e,'borderTopWidth') || '';
		var r = jQuery.curCSS(e,'borderRightWidth') || '';
		var b = jQuery.curCSS(e,'borderBottomWidth') || '';
		var l = jQuery.curCSS(e,'borderLeftWidth') || '';
		if (toInteger)
			return {
				t: parseInt(t, 10)||0,
				r: parseInt(r, 10)||0,
				b: parseInt(b, 10)||0,
				l: parseInt(l, 10)||0
			};
		else
			return {t: t, r: r,	b: b, l: l};
	},
	traverseDOM : function(nodeEl, func)
	{
		func(nodeEl);
		nodeEl = nodeEl.firstChild;
		while(nodeEl){
			EYE.traverseDOM(nodeEl, func);
			nodeEl = nodeEl.nextSibling;
		}
	},
	getInnerWidth :  function(el, scroll) {
		var offsetW = el.offsetWidth;
		return scroll ? Math.max(el.scrollWidth,offsetW) - offsetW + el.clientWidth:el.clientWidth;
	},
	getInnerHeight : function(el, scroll) {
		var offsetH = el.offsetHeight;
		return scroll ? Math.max(el.scrollHeight,offsetH) - offsetH + el.clientHeight:el.clientHeight;
	},
	getExtraWidth : function(el) {
		if($.boxModel)
			return (parseInt($.curCSS(el, 'paddingLeft'))||0)
				+ (parseInt($.curCSS(el, 'paddingRight'))||0)
				+ (parseInt($.curCSS(el, 'borderLeftWidth'))||0)
				+ (parseInt($.curCSS(el, 'borderRightWidth'))||0);
		return 0;
	},
	getExtraHeight : function(el) {
		if($.boxModel)
			return (parseInt($.curCSS(el, 'paddingTop'))||0)
				+ (parseInt($.curCSS(el, 'paddingBottom'))||0)
				+ (parseInt($.curCSS(el, 'borderTopWidth'))||0)
				+ (parseInt($.curCSS(el, 'borderBottomWidth'))||0);
		return 0;
	},
	isChildOf: function(parentEl, el, container) {
		if (parentEl == el) {
			return true;
		}
		if (!el || !el.nodeType || el.nodeType != 1) {
			return false;
		}
		if (parentEl.contains && !$.browser.safari) {
			return parentEl.contains(el);
		}
		if ( parentEl.compareDocumentPosition ) {
			return !!(parentEl.compareDocumentPosition(el) & 16);
		}
		var prEl = el.parentNode;
		while(prEl && prEl != container) {
			if (prEl == parentEl)
				return true;
			prEl = prEl.parentNode;
		}
		return false;
	},
	centerEl : function(el, axis)
	{
		var clientScroll = EYE.getScroll();
		var size = EYE.getSize(el);
		if (!axis || axis == 'vertically')
			$(el).css(
				{
					top: clientScroll.t + ((Math.min(clientScroll.h,clientScroll.ih) - size.hb)/2) + 'px'
				}
			);
		if (!axis || axis == 'horizontally')
			$(el).css(
				{
					left: clientScroll.l + ((Math.min(clientScroll.w,clientScroll.iw) - size.wb)/2) + 'px'
				}
			);
	}
});
if (!$.easing.easeout) {
	$.easing.easeout = function(p, n, firstNum, delta, duration) {
		return -delta * ((n=n/duration-1)*n*n*n - 1) + firstNum;
	};
}
	
})(jQuery);/**
 *
 * Color picker
 * Author: Stefan Petre www.eyecon.ro
 * 
 * Dual licensed under the MIT and GPL licenses
 * 
 */
(function ($) {
	var ColorPicker = function () {
		var
			ids = {},
			inAction,
			charMin = 65,
			visible,
			tpl = '<div class="colorpicker"><div class="colorpicker_color"><div><div></div></div></div><div class="colorpicker_hue"><div></div></div><div class="colorpicker_new_color"></div><div class="colorpicker_current_color"></div><div class="colorpicker_hex"><input type="text" maxlength="6" size="6" /></div><div class="colorpicker_rgb_r colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_g colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_h colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_s colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_submit"></div></div>',
			defaults = {
				eventName: 'click',
				onShow: function () {},
				onBeforeShow: function(){},
				onHide: function () {},
				onChange: function () {},
				onSubmit: function () {},
				color: 'ff0000',
				livePreview: true,
				flat: false
			},
			fillRGBFields = function  (hsb, cal) {
				var rgb = HSBToRGB(hsb);
				$(cal).data('colorpicker').fields
					.eq(1).val(rgb.r).end()
					.eq(2).val(rgb.g).end()
					.eq(3).val(rgb.b).end();
			},
			fillHSBFields = function  (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(4).val(hsb.h).end()
					.eq(5).val(hsb.s).end()
					.eq(6).val(hsb.b).end();
			},
			fillHexFields = function (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(0).val(HSBToHex(hsb)).end();
			},
			setSelector = function (hsb, cal) {
				$(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({h: hsb.h, s: 100, b: 100}));
				$(cal).data('colorpicker').selectorIndic.css({
					left: parseInt(150 * hsb.s/100, 10),
					top: parseInt(150 * (100-hsb.b)/100, 10)
				});
			},
			setHue = function (hsb, cal) {
				$(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h/360, 10));
			},
			setCurrentColor = function (hsb, cal) {
				$(cal).data('colorpicker').currentColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			setNewColor = function (hsb, cal) {
				$(cal).data('colorpicker').newColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			keyDown = function (ev) {
				var pressedKey = ev.charCode || ev.keyCode || -1;
				if ((pressedKey > charMin && pressedKey <= 90) || pressedKey == 32) {
					return false;
				}
				var cal = $(this).parent().parent();
				if (cal.data('colorpicker').livePreview === true) {
					change.apply(this);
				}
			},
			change = function (ev) {
				var cal = $(this).parent().parent(), col;
				if (this.parentNode.className.indexOf('_hex') > 0) {
					cal.data('colorpicker').color = col = HexToHSB(fixHex(this.value));
				} else if (this.parentNode.className.indexOf('_hsb') > 0) {
					cal.data('colorpicker').color = col = fixHSB({
						h: parseInt(cal.data('colorpicker').fields.eq(4).val(), 10),
						s: parseInt(cal.data('colorpicker').fields.eq(5).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(6).val(), 10)
					});
				} else {
					cal.data('colorpicker').color = col = RGBToHSB(fixRGB({
						r: parseInt(cal.data('colorpicker').fields.eq(1).val(), 10),
						g: parseInt(cal.data('colorpicker').fields.eq(2).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(3).val(), 10)
					}));
				}
				if (ev) {
					fillRGBFields(col, cal.get(0));
					fillHexFields(col, cal.get(0));
					fillHSBFields(col, cal.get(0));
				}
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
				cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
			},
			blur = function (ev) {
				var cal = $(this).parent().parent();
				cal.data('colorpicker').fields.parent().removeClass('colorpicker_focus');
			},
			focus = function () {
				charMin = this.parentNode.className.indexOf('_hex') > 0 ? 70 : 65;
				$(this).parent().parent().data('colorpicker').fields.parent().removeClass('colorpicker_focus');
				$(this).parent().addClass('colorpicker_focus');
			},
			downIncrement = function (ev) {
				var field = $(this).parent().find('input').focus();
				var current = {
					el: $(this).parent().addClass('colorpicker_slider'),
					max: this.parentNode.className.indexOf('_hsb_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsb') > 0 ? 100 : 255),
					y: ev.pageY,
					field: field,
					val: parseInt(field.val(), 10),
					preview: $(this).parent().parent().data('colorpicker').livePreview					
				};
				$(document).bind('mouseup', current, upIncrement);
				$(document).bind('mousemove', current, moveIncrement);
			},
			moveIncrement = function (ev) {
				ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10))));
				if (ev.data.preview) {
					change.apply(ev.data.field.get(0), [true]);
				}
				return false;
			},
			upIncrement = function (ev) {
				change.apply(ev.data.field.get(0), [true]);
				ev.data.el.removeClass('colorpicker_slider').find('input').focus();
				$(document).unbind('mouseup', upIncrement);
				$(document).unbind('mousemove', moveIncrement);
				return false;
			},
			downHue = function (ev) {
				var current = {
					cal: $(this).parent(),
					y: $(this).offset().top
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upHue);
				$(document).bind('mousemove', current, moveHue);
			},
			moveHue = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.y))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upHue = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upHue);
				$(document).unbind('mousemove', moveHue);
				return false;
			},
			downSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upSelector);
				$(document).bind('mousemove', current, moveSelector);
			},
			moveSelector = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.pos.top))))/150, 10))
						.end()
						.eq(5)
						.val(parseInt(100*(Math.max(0,Math.min(150,(ev.pageX - ev.data.pos.left))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upSelector = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upSelector);
				$(document).unbind('mousemove', moveSelector);
				return false;
			},
			enterSubmit = function (ev) {
				$(this).addClass('colorpicker_focus');
			},
			leaveSubmit = function (ev) {
				$(this).removeClass('colorpicker_focus');
			},
			clickSubmit = function (ev) {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').color;
				cal.data('colorpicker').origColor = col;
				setCurrentColor(col, cal.get(0));
				cal.data('colorpicker').onSubmit(col, HSBToHex(col), HSBToRGB(col), cal.data('colorpicker').el);
			},
			show = function (ev) {
				var cal = $('#' + $(this).data('colorpickerId'));
				cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
				var pos = $(this).offset();
				var viewPort = getViewport();
				var top = pos.top + this.offsetHeight;
				var left = pos.left;
				if (top + 176 > viewPort.t + viewPort.h) {
					top -= this.offsetHeight + 176;
				}
				if (left + 356 > viewPort.l + viewPort.w) {
					left -= 356;
				}
				cal.css({left: left + 'px', top: top + 'px'});
				if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
					cal.show();
				}
				$(document).bind('mousedown', {cal: cal}, hide);
				return false;
			},
			hide = function (ev) {
				if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$(document).unbind('mousedown', hide);
				}
			},
			isChildOf = function(parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if ( parentEl.compareDocumentPosition ) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while(prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},
			getViewport = function () {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},
			fixHSB = function (hsb) {
				return {
					h: Math.min(360, Math.max(0, hsb.h)),
					s: Math.min(100, Math.max(0, hsb.s)),
					b: Math.min(100, Math.max(0, hsb.b))
				};
			}, 
			fixRGB = function (rgb) {
				return {
					r: Math.min(255, Math.max(0, rgb.r)),
					g: Math.min(255, Math.max(0, rgb.g)),
					b: Math.min(255, Math.max(0, rgb.b))
				};
			},
			fixHex = function (hex) {
				var len = 6 - hex.length;
				if (len > 0) {
					var o = [];
					for (var i=0; i<len; i++) {
						o.push('0');
					}
					o.push(hex);
					hex = o.join('');
				}
				return hex;
			}, 
			HexToRGB = function (hex) {
				var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
				return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
			},
			HexToHSB = function (hex) {
				return RGBToHSB(HexToRGB(hex));
			},
			RGBToHSB = function (rgb) {
				var hsb = {
					h: 0,
					s: 0,
					b: 0
				};
				var min = Math.min(rgb.r, rgb.g, rgb.b);
				var max = Math.max(rgb.r, rgb.g, rgb.b);
				var delta = max - min;
				hsb.b = max;
				if (max != 0) {
					
				}
				hsb.s = max != 0 ? 255 * delta / max : 0;
				if (hsb.s != 0) {
					if (rgb.r == max) {
						hsb.h = (rgb.g - rgb.b) / delta;
					} else if (rgb.g == max) {
						hsb.h = 2 + (rgb.b - rgb.r) / delta;
					} else {
						hsb.h = 4 + (rgb.r - rgb.g) / delta;
					}
				} else {
					hsb.h = -1;
				}
				hsb.h *= 60;
				if (hsb.h < 0) {
					hsb.h += 360;
				}
				hsb.s *= 100/255;
				hsb.b *= 100/255;
				return hsb;
			},
			HSBToRGB = function (hsb) {
				var rgb = {};
				var h = Math.round(hsb.h);
				var s = Math.round(hsb.s*255/100);
				var v = Math.round(hsb.b*255/100);
				if(s == 0) {
					rgb.r = rgb.g = rgb.b = v;
				} else {
					var t1 = v;
					var t2 = (255-s)*v/255;
					var t3 = (t1-t2)*(h%60)/60;
					if(h==360) h = 0;
					if(h<60) {rgb.r=t1;	rgb.b=t2; rgb.g=t2+t3}
					else if(h<120) {rgb.g=t1; rgb.b=t2;	rgb.r=t1-t3}
					else if(h<180) {rgb.g=t1; rgb.r=t2;	rgb.b=t2+t3}
					else if(h<240) {rgb.b=t1; rgb.r=t2;	rgb.g=t1-t3}
					else if(h<300) {rgb.b=t1; rgb.g=t2;	rgb.r=t2+t3}
					else if(h<360) {rgb.r=t1; rgb.g=t2;	rgb.b=t1-t3}
					else {rgb.r=0; rgb.g=0;	rgb.b=0}
				}
				return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
			},
			RGBToHex = function (rgb) {
				var hex = [
					rgb.r.toString(16),
					rgb.g.toString(16),
					rgb.b.toString(16)
				];
				$.each(hex, function (nr, val) {
					if (val.length == 1) {
						hex[nr] = '0' + val;
					}
				});
				return hex.join('');
			},
			HSBToHex = function (hsb) {
				return RGBToHex(HSBToRGB(hsb));
			},
			restoreOriginal = function () {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').origColor;
				cal.data('colorpicker').color = col;
				fillRGBFields(col, cal.get(0));
				fillHexFields(col, cal.get(0));
				fillHSBFields(col, cal.get(0));
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
			};
		return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt||{});
				if (typeof opt.color == 'string') {
					opt.color = HexToHSB(opt.color);
				} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
					opt.color = RGBToHSB(opt.color);
				} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
					opt.color = fixHSB(opt.color);
				} else {
					return this;
				}
				return this.each(function () {
					if (!$(this).data('colorpickerId')) {
						var options = $.extend({}, opt);
						options.origColor = opt.color;
						var id = 'collorpicker_' + parseInt(Math.random() * 1000);
						$(this).data('colorpickerId', id);
						var cal = $(tpl).attr('id', id);
						if (options.flat) {
							cal.appendTo(this).show();
						} else {
							cal.appendTo(document.body);
						}
						options.fields = cal
											.find('input')
												.bind('keyup', keyDown)
												.bind('change', change)
												.bind('blur', blur)
												.bind('focus', focus);
						cal
							.find('span').bind('mousedown', downIncrement).end()
							.find('>div.colorpicker_current_color').bind('click', restoreOriginal);
						options.selector = cal.find('div.colorpicker_color').bind('mousedown', downSelector);
						options.selectorIndic = options.selector.find('div div');
						options.el = this;
						options.hue = cal.find('div.colorpicker_hue div');
						cal.find('div.colorpicker_hue').bind('mousedown', downHue);
						options.newColor = cal.find('div.colorpicker_new_color');
						options.currentColor = cal.find('div.colorpicker_current_color');
						cal.data('colorpicker', options);
						cal.find('div.colorpicker_submit')
							.bind('mouseenter', enterSubmit)
							.bind('mouseleave', leaveSubmit)
							.bind('click', clickSubmit);
						fillRGBFields(options.color, cal.get(0));
						fillHSBFields(options.color, cal.get(0));
						fillHexFields(options.color, cal.get(0));
						setHue(options.color, cal.get(0));
						setSelector(options.color, cal.get(0));
						setCurrentColor(options.color, cal.get(0));
						setNewColor(options.color, cal.get(0));
						if (options.flat) {
							cal.css({
								position: 'relative',
								display: 'block'
							});
						} else {
							$(this).bind(options.eventName, show);
						}
					}
				});
			},
			showPicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						show.apply(this);
					}
				});
			},
			hidePicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						$('#' + $(this).data('colorpickerId')).hide();
					}
				});
			},
			setColor: function(col) {
				if (typeof col == 'string') {
					col = HexToHSB(col);
				} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
					col = RGBToHSB(col);
				} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
					col = fixHSB(col);
				} else {
					return this;
				}
				return this.each(function(){
					if ($(this).data('colorpickerId')) {
						var cal = $('#' + $(this).data('colorpickerId'));
						cal.data('colorpicker').color = col;
						cal.data('colorpicker').origColor = col;
						fillRGBFields(col, cal.get(0));
						fillHSBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
						setHue(col, cal.get(0));
						setSelector(col, cal.get(0));
						setCurrentColor(col, cal.get(0));
						setNewColor(col, cal.get(0));
					}
				});
			}
		};
	}();
	$.fn.extend({
		ColorPicker: ColorPicker.init,
		ColorPickerHide: ColorPicker.hidePicker,
		ColorPickerShow: ColorPicker.showPicker,
		ColorPickerSetColor: ColorPicker.setColor
	});
})(jQuery)/**
 *
 * Zoomimage
 * Author: Stefan Petre www.eyecon.ro
 * 
 */
(function($){
	var EYE = window.EYE = function() {
		var _registered = {
			init: []
		};
		return {
			init: function() {
				$.each(_registered.init, function(nr, fn){
					fn.call();
				});
			},
			extend: function(prop) {
				for (var i in prop) {
					if (prop[i] != undefined) {
						this[i] = prop[i];
					}
				}
			},
			register: function(fn, type) {
				if (!_registered[type]) {
					_registered[type] = [];
				}
				_registered[type].push(fn);
			}
		};
	}();
	$(EYE.init);
})(jQuery);
/*
 * jQuery JavaScript Library v1.3.2
 * http://jquery.com/
 *
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
 * Revision: 6246
 */
(function(){var l=this,g,y=l.jQuery,p=l.$,o=l.jQuery=l.$=function(E,F){return new o.fn.init(E,F)},D=/^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,f=/^.[^:#\[\.,]*$/;o.fn=o.prototype={init:function(E,H){E=E||document;if(E.nodeType){this[0]=E;this.length=1;this.context=E;return this}if(typeof E==="string"){var G=D.exec(E);if(G&&(G[1]||!H)){if(G[1]){E=o.clean([G[1]],H)}else{var I=document.getElementById(G[3]);if(I&&I.id!=G[3]){return o().find(E)}var F=o(I||[]);F.context=document;F.selector=E;return F}}else{return o(H).find(E)}}else{if(o.isFunction(E)){return o(document).ready(E)}}if(E.selector&&E.context){this.selector=E.selector;this.context=E.context}return this.setArray(o.isArray(E)?E:o.makeArray(E))},selector:"",jquery:"1.3.2",size:function(){return this.length},get:function(E){return E===g?Array.prototype.slice.call(this):this[E]},pushStack:function(F,H,E){var G=o(F);G.prevObject=this;G.context=this.context;if(H==="find"){G.selector=this.selector+(this.selector?" ":"")+E}else{if(H){G.selector=this.selector+"."+H+"("+E+")"}}return G},setArray:function(E){this.length=0;Array.prototype.push.apply(this,E);return this},each:function(F,E){return o.each(this,F,E)},index:function(E){return o.inArray(E&&E.jquery?E[0]:E,this)},attr:function(F,H,G){var E=F;if(typeof F==="string"){if(H===g){return this[0]&&o[G||"attr"](this[0],F)}else{E={};E[F]=H}}return this.each(function(I){for(F in E){o.attr(G?this.style:this,F,o.prop(this,E[F],G,I,F))}})},css:function(E,F){if((E=="width"||E=="height")&&parseFloat(F)<0){F=g}return this.attr(E,F,"curCSS")},text:function(F){if(typeof F!=="object"&&F!=null){return this.empty().append((this[0]&&this[0].ownerDocument||document).createTextNode(F))}var E="";o.each(F||this,function(){o.each(this.childNodes,function(){if(this.nodeType!=8){E+=this.nodeType!=1?this.nodeValue:o.fn.text([this])}})});return E},wrapAll:function(E){if(this[0]){var F=o(E,this[0].ownerDocument).clone();if(this[0].parentNode){F.insertBefore(this[0])}F.map(function(){var G=this;while(G.firstChild){G=G.firstChild}return G}).append(this)}return this},wrapInner:function(E){return this.each(function(){o(this).contents().wrapAll(E)})},wrap:function(E){return this.each(function(){o(this).wrapAll(E)})},append:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.appendChild(E)}})},prepend:function(){return this.domManip(arguments,true,function(E){if(this.nodeType==1){this.insertBefore(E,this.firstChild)}})},before:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this)})},after:function(){return this.domManip(arguments,false,function(E){this.parentNode.insertBefore(E,this.nextSibling)})},end:function(){return this.prevObject||o([])},push:[].push,sort:[].sort,splice:[].splice,find:function(E){if(this.length===1){var F=this.pushStack([],"find",E);F.length=0;o.find(E,this[0],F);return F}else{return this.pushStack(o.unique(o.map(this,function(G){return o.find(E,G)})),"find",E)}},clone:function(G){var E=this.map(function(){if(!o.support.noCloneEvent&&!o.isXMLDoc(this)){var I=this.outerHTML;if(!I){var J=this.ownerDocument.createElement("div");J.appendChild(this.cloneNode(true));I=J.innerHTML}return o.clean([I.replace(/ jQuery\d+="(?:\d+|null)"/g,"").replace(/^\s*/,"")])[0]}else{return this.cloneNode(true)}});if(G===true){var H=this.find("*").andSelf(),F=0;E.find("*").andSelf().each(function(){if(this.nodeName!==H[F].nodeName){return}var I=o.data(H[F],"events");for(var K in I){for(var J in I[K]){o.event.add(this,K,I[K][J],I[K][J].data)}}F++})}return E},filter:function(E){return this.pushStack(o.isFunction(E)&&o.grep(this,function(G,F){return E.call(G,F)})||o.multiFilter(E,o.grep(this,function(F){return F.nodeType===1})),"filter",E)},closest:function(E){var G=o.expr.match.POS.test(E)?o(E):null,F=0;return this.map(function(){var H=this;while(H&&H.ownerDocument){if(G?G.index(H)>-1:o(H).is(E)){o.data(H,"closest",F);return H}H=H.parentNode;F++}})},not:function(E){if(typeof E==="string"){if(f.test(E)){return this.pushStack(o.multiFilter(E,this,true),"not",E)}else{E=o.multiFilter(E,this)}}var F=E.length&&E[E.length-1]!==g&&!E.nodeType;return this.filter(function(){return F?o.inArray(this,E)<0:this!=E})},add:function(E){return this.pushStack(o.unique(o.merge(this.get(),typeof E==="string"?o(E):o.makeArray(E))))},is:function(E){return !!E&&o.multiFilter(E,this).length>0},hasClass:function(E){return !!E&&this.is("."+E)},val:function(K){if(K===g){var E=this[0];if(E){if(o.nodeName(E,"option")){return(E.attributes.value||{}).specified?E.value:E.text}if(o.nodeName(E,"select")){var I=E.selectedIndex,L=[],M=E.options,H=E.type=="select-one";if(I<0){return null}for(var F=H?I:0,J=H?I+1:M.length;F<J;F++){var G=M[F];if(G.selected){K=o(G).val();if(H){return K}L.push(K)}}return L}return(E.value||"").replace(/\r/g,"")}return g}if(typeof K==="number"){K+=""}return this.each(function(){if(this.nodeType!=1){return}if(o.isArray(K)&&/radio|checkbox/.test(this.type)){this.checked=(o.inArray(this.value,K)>=0||o.inArray(this.name,K)>=0)}else{if(o.nodeName(this,"select")){var N=o.makeArray(K);o("option",this).each(function(){this.selected=(o.inArray(this.value,N)>=0||o.inArray(this.text,N)>=0)});if(!N.length){this.selectedIndex=-1}}else{this.value=K}}})},html:function(E){return E===g?(this[0]?this[0].innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g,""):null):this.empty().append(E)},replaceWith:function(E){return this.after(E).remove()},eq:function(E){return this.slice(E,+E+1)},slice:function(){return this.pushStack(Array.prototype.slice.apply(this,arguments),"slice",Array.prototype.slice.call(arguments).join(","))},map:function(E){return this.pushStack(o.map(this,function(G,F){return E.call(G,F,G)}))},andSelf:function(){return this.add(this.prevObject)},domManip:function(J,M,L){if(this[0]){var I=(this[0].ownerDocument||this[0]).createDocumentFragment(),F=o.clean(J,(this[0].ownerDocument||this[0]),I),H=I.firstChild;if(H){for(var G=0,E=this.length;G<E;G++){L.call(K(this[G],H),this.length>1||G>0?I.cloneNode(true):I)}}if(F){o.each(F,z)}}return this;function K(N,O){return M&&o.nodeName(N,"table")&&o.nodeName(O,"tr")?(N.getElementsByTagName("tbody")[0]||N.appendChild(N.ownerDocument.createElement("tbody"))):N}}};o.fn.init.prototype=o.fn;function z(E,F){if(F.src){o.ajax({url:F.src,async:false,dataType:"script"})}else{o.globalEval(F.text||F.textContent||F.innerHTML||"")}if(F.parentNode){F.parentNode.removeChild(F)}}function e(){return +new Date}o.extend=o.fn.extend=function(){var J=arguments[0]||{},H=1,I=arguments.length,E=false,G;if(typeof J==="boolean"){E=J;J=arguments[1]||{};H=2}if(typeof J!=="object"&&!o.isFunction(J)){J={}}if(I==H){J=this;--H}for(;H<I;H++){if((G=arguments[H])!=null){for(var F in G){var K=J[F],L=G[F];if(J===L){continue}if(E&&L&&typeof L==="object"&&!L.nodeType){J[F]=o.extend(E,K||(L.length!=null?[]:{}),L)}else{if(L!==g){J[F]=L}}}}}return J};var b=/z-?index|font-?weight|opacity|zoom|line-?height/i,q=document.defaultView||{},s=Object.prototype.toString;o.extend({noConflict:function(E){l.$=p;if(E){l.jQuery=y}return o},isFunction:function(E){return s.call(E)==="[object Function]"},isArray:function(E){return s.call(E)==="[object Array]"},isXMLDoc:function(E){return E.nodeType===9&&E.documentElement.nodeName!=="HTML"||!!E.ownerDocument&&o.isXMLDoc(E.ownerDocument)},globalEval:function(G){if(G&&/\S/.test(G)){var F=document.getElementsByTagName("head")[0]||document.documentElement,E=document.createElement("script");E.type="text/javascript";if(o.support.scriptEval){E.appendChild(document.createTextNode(G))}else{E.text=G}F.insertBefore(E,F.firstChild);F.removeChild(E)}},nodeName:function(F,E){return F.nodeName&&F.nodeName.toUpperCase()==E.toUpperCase()},each:function(G,K,F){var E,H=0,I=G.length;if(F){if(I===g){for(E in G){if(K.apply(G[E],F)===false){break}}}else{for(;H<I;){if(K.apply(G[H++],F)===false){break}}}}else{if(I===g){for(E in G){if(K.call(G[E],E,G[E])===false){break}}}else{for(var J=G[0];H<I&&K.call(J,H,J)!==false;J=G[++H]){}}}return G},prop:function(H,I,G,F,E){if(o.isFunction(I)){I=I.call(H,F)}return typeof I==="number"&&G=="curCSS"&&!b.test(E)?I+"px":I},className:{add:function(E,F){o.each((F||"").split(/\s+/),function(G,H){if(E.nodeType==1&&!o.className.has(E.className,H)){E.className+=(E.className?" ":"")+H}})},remove:function(E,F){if(E.nodeType==1){E.className=F!==g?o.grep(E.className.split(/\s+/),function(G){return !o.className.has(F,G)}).join(" "):""}},has:function(F,E){return F&&o.inArray(E,(F.className||F).toString().split(/\s+/))>-1}},swap:function(H,G,I){var E={};for(var F in G){E[F]=H.style[F];H.style[F]=G[F]}I.call(H);for(var F in G){H.style[F]=E[F]}},css:function(H,F,J,E){if(F=="width"||F=="height"){var L,G={position:"absolute",visibility:"hidden",display:"block"},K=F=="width"?["Left","Right"]:["Top","Bottom"];function I(){L=F=="width"?H.offsetWidth:H.offsetHeight;if(E==="border"){return}o.each(K,function(){if(!E){L-=parseFloat(o.curCSS(H,"padding"+this,true))||0}if(E==="margin"){L+=parseFloat(o.curCSS(H,"margin"+this,true))||0}else{L-=parseFloat(o.curCSS(H,"border"+this+"Width",true))||0}})}if(H.offsetWidth!==0){I()}else{o.swap(H,G,I)}return Math.max(0,Math.round(L))}return o.curCSS(H,F,J)},curCSS:function(I,F,G){var L,E=I.style;if(F=="opacity"&&!o.support.opacity){L=o.attr(E,"opacity");return L==""?"1":L}if(F.match(/float/i)){F=w}if(!G&&E&&E[F]){L=E[F]}else{if(q.getComputedStyle){if(F.match(/float/i)){F="float"}F=F.replace(/([A-Z])/g,"-$1").toLowerCase();var M=q.getComputedStyle(I,null);if(M){L=M.getPropertyValue(F)}if(F=="opacity"&&L==""){L="1"}}else{if(I.currentStyle){var J=F.replace(/\-(\w)/g,function(N,O){return O.toUpperCase()});L=I.currentStyle[F]||I.currentStyle[J];if(!/^\d+(px)?$/i.test(L)&&/^\d/.test(L)){var H=E.left,K=I.runtimeStyle.left;I.runtimeStyle.left=I.currentStyle.left;E.left=L||0;L=E.pixelLeft+"px";E.left=H;I.runtimeStyle.left=K}}}}return L},clean:function(F,K,I){K=K||document;if(typeof K.createElement==="undefined"){K=K.ownerDocument||K[0]&&K[0].ownerDocument||document}if(!I&&F.length===1&&typeof F[0]==="string"){var H=/^<(\w+)\s*\/?>$/.exec(F[0]);if(H){return[K.createElement(H[1])]}}var G=[],E=[],L=K.createElement("div");o.each(F,function(P,S){if(typeof S==="number"){S+=""}if(!S){return}if(typeof S==="string"){S=S.replace(/(<(\w+)[^>]*?)\/>/g,function(U,V,T){return T.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i)?U:V+"></"+T+">"});var O=S.replace(/^\s+/,"").substring(0,10).toLowerCase();var Q=!O.indexOf("<opt")&&[1,"<select multiple='multiple'>","</select>"]||!O.indexOf("<leg")&&[1,"<fieldset>","</fieldset>"]||O.match(/^<(thead|tbody|tfoot|colg|cap)/)&&[1,"<table>","</table>"]||!O.indexOf("<tr")&&[2,"<table><tbody>","</tbody></table>"]||(!O.indexOf("<td")||!O.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||!O.indexOf("<col")&&[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"]||!o.support.htmlSerialize&&[1,"div<div>","</div>"]||[0,"",""];L.innerHTML=Q[1]+S+Q[2];while(Q[0]--){L=L.lastChild}if(!o.support.tbody){var R=/<tbody/i.test(S),N=!O.indexOf("<table")&&!R?L.firstChild&&L.firstChild.childNodes:Q[1]=="<table>"&&!R?L.childNodes:[];for(var M=N.length-1;M>=0;--M){if(o.nodeName(N[M],"tbody")&&!N[M].childNodes.length){N[M].parentNode.removeChild(N[M])}}}if(!o.support.leadingWhitespace&&/^\s/.test(S)){L.insertBefore(K.createTextNode(S.match(/^\s*/)[0]),L.firstChild)}S=o.makeArray(L.childNodes)}if(S.nodeType){G.push(S)}else{G=o.merge(G,S)}});if(I){for(var J=0;G[J];J++){if(o.nodeName(G[J],"script")&&(!G[J].type||G[J].type.toLowerCase()==="text/javascript")){E.push(G[J].parentNode?G[J].parentNode.removeChild(G[J]):G[J])}else{if(G[J].nodeType===1){G.splice.apply(G,[J+1,0].concat(o.makeArray(G[J].getElementsByTagName("script"))))}I.appendChild(G[J])}}return E}return G},attr:function(J,G,K){if(!J||J.nodeType==3||J.nodeType==8){return g}var H=!o.isXMLDoc(J),L=K!==g;G=H&&o.props[G]||G;if(J.tagName){var F=/href|src|style/.test(G);if(G=="selected"&&J.parentNode){J.parentNode.selectedIndex}if(G in J&&H&&!F){if(L){if(G=="type"&&o.nodeName(J,"input")&&J.parentNode){throw"type property can't be changed"}J[G]=K}if(o.nodeName(J,"form")&&J.getAttributeNode(G)){return J.getAttributeNode(G).nodeValue}if(G=="tabIndex"){var I=J.getAttributeNode("tabIndex");return I&&I.specified?I.value:J.nodeName.match(/(button|input|object|select|textarea)/i)?0:J.nodeName.match(/^(a|area)$/i)&&J.href?0:g}return J[G]}if(!o.support.style&&H&&G=="style"){return o.attr(J.style,"cssText",K)}if(L){J.setAttribute(G,""+K)}var E=!o.support.hrefNormalized&&H&&F?J.getAttribute(G,2):J.getAttribute(G);return E===null?g:E}if(!o.support.opacity&&G=="opacity"){if(L){J.zoom=1;J.filter=(J.filter||"").replace(/alpha\([^)]*\)/,"")+(parseInt(K)+""=="NaN"?"":"alpha(opacity="+K*100+")")}return J.filter&&J.filter.indexOf("opacity=")>=0?(parseFloat(J.filter.match(/opacity=([^)]*)/)[1])/100)+"":""}G=G.replace(/-([a-z])/ig,function(M,N){return N.toUpperCase()});if(L){J[G]=K}return J[G]},trim:function(E){return(E||"").replace(/^\s+|\s+$/g,"")},makeArray:function(G){var E=[];if(G!=null){var F=G.length;if(F==null||typeof G==="string"||o.isFunction(G)||G.setInterval){E[0]=G}else{while(F){E[--F]=G[F]}}}return E},inArray:function(G,H){for(var E=0,F=H.length;E<F;E++){if(H[E]===G){return E}}return -1},merge:function(H,E){var F=0,G,I=H.length;if(!o.support.getAll){while((G=E[F++])!=null){if(G.nodeType!=8){H[I++]=G}}}else{while((G=E[F++])!=null){H[I++]=G}}return H},unique:function(K){var F=[],E={};try{for(var G=0,H=K.length;G<H;G++){var J=o.data(K[G]);if(!E[J]){E[J]=true;F.push(K[G])}}}catch(I){F=K}return F},grep:function(F,J,E){var G=[];for(var H=0,I=F.length;H<I;H++){if(!E!=!J(F[H],H)){G.push(F[H])}}return G},map:function(E,J){var F=[];for(var G=0,H=E.length;G<H;G++){var I=J(E[G],G);if(I!=null){F[F.length]=I}}return F.concat.apply([],F)}});var C=navigator.userAgent.toLowerCase();o.browser={version:(C.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1],safari:/webkit/.test(C),opera:/opera/.test(C),msie:/msie/.test(C)&&!/opera/.test(C),mozilla:/mozilla/.test(C)&&!/(compatible|webkit)/.test(C)};o.each({parent:function(E){return E.parentNode},parents:function(E){return o.dir(E,"parentNode")},next:function(E){return o.nth(E,2,"nextSibling")},prev:function(E){return o.nth(E,2,"previousSibling")},nextAll:function(E){return o.dir(E,"nextSibling")},prevAll:function(E){return o.dir(E,"previousSibling")},siblings:function(E){return o.sibling(E.parentNode.firstChild,E)},children:function(E){return o.sibling(E.firstChild)},contents:function(E){return o.nodeName(E,"iframe")?E.contentDocument||E.contentWindow.document:o.makeArray(E.childNodes)}},function(E,F){o.fn[E]=function(G){var H=o.map(this,F);if(G&&typeof G=="string"){H=o.multiFilter(G,H)}return this.pushStack(o.unique(H),E,G)}});o.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(E,F){o.fn[E]=function(G){var J=[],L=o(G);for(var K=0,H=L.length;K<H;K++){var I=(K>0?this.clone(true):this).get();o.fn[F].apply(o(L[K]),I);J=J.concat(I)}return this.pushStack(J,E,G)}});o.each({removeAttr:function(E){o.attr(this,E,"");if(this.nodeType==1){this.removeAttribute(E)}},addClass:function(E){o.className.add(this,E)},removeClass:function(E){o.className.remove(this,E)},toggleClass:function(F,E){if(typeof E!=="boolean"){E=!o.className.has(this,F)}o.className[E?"add":"remove"](this,F)},remove:function(E){if(!E||o.filter(E,[this]).length){o("*",this).add([this]).each(function(){o.event.remove(this);o.removeData(this)});if(this.parentNode){this.parentNode.removeChild(this)}}},empty:function(){o(this).children().remove();while(this.firstChild){this.removeChild(this.firstChild)}}},function(E,F){o.fn[E]=function(){return this.each(F,arguments)}});function j(E,F){return E[0]&&parseInt(o.curCSS(E[0],F,true),10)||0}var h="jQuery"+e(),v=0,A={};o.extend({cache:{},data:function(F,E,G){F=F==l?A:F;var H=F[h];if(!H){H=F[h]=++v}if(E&&!o.cache[H]){o.cache[H]={}}if(G!==g){o.cache[H][E]=G}return E?o.cache[H][E]:H},removeData:function(F,E){F=F==l?A:F;var H=F[h];if(E){if(o.cache[H]){delete o.cache[H][E];E="";for(E in o.cache[H]){break}if(!E){o.removeData(F)}}}else{try{delete F[h]}catch(G){if(F.removeAttribute){F.removeAttribute(h)}}delete o.cache[H]}},queue:function(F,E,H){if(F){E=(E||"fx")+"queue";var G=o.data(F,E);if(!G||o.isArray(H)){G=o.data(F,E,o.makeArray(H))}else{if(H){G.push(H)}}}return G},dequeue:function(H,G){var E=o.queue(H,G),F=E.shift();if(!G||G==="fx"){F=E[0]}if(F!==g){F.call(H)}}});o.fn.extend({data:function(E,G){var H=E.split(".");H[1]=H[1]?"."+H[1]:"";if(G===g){var F=this.triggerHandler("getData"+H[1]+"!",[H[0]]);if(F===g&&this.length){F=o.data(this[0],E)}return F===g&&H[1]?this.data(H[0]):F}else{return this.trigger("setData"+H[1]+"!",[H[0],G]).each(function(){o.data(this,E,G)})}},removeData:function(E){return this.each(function(){o.removeData(this,E)})},queue:function(E,F){if(typeof E!=="string"){F=E;E="fx"}if(F===g){return o.queue(this[0],E)}return this.each(function(){var G=o.queue(this,E,F);if(E=="fx"&&G.length==1){G[0].call(this)}})},dequeue:function(E){return this.each(function(){o.dequeue(this,E)})}});
/*
 * Sizzle CSS Selector Engine - v0.9.3
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){var R=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,L=0,H=Object.prototype.toString;var F=function(Y,U,ab,ac){ab=ab||[];U=U||document;if(U.nodeType!==1&&U.nodeType!==9){return[]}if(!Y||typeof Y!=="string"){return ab}var Z=[],W,af,ai,T,ad,V,X=true;R.lastIndex=0;while((W=R.exec(Y))!==null){Z.push(W[1]);if(W[2]){V=RegExp.rightContext;break}}if(Z.length>1&&M.exec(Y)){if(Z.length===2&&I.relative[Z[0]]){af=J(Z[0]+Z[1],U)}else{af=I.relative[Z[0]]?[U]:F(Z.shift(),U);while(Z.length){Y=Z.shift();if(I.relative[Y]){Y+=Z.shift()}af=J(Y,af)}}}else{var ae=ac?{expr:Z.pop(),set:E(ac)}:F.find(Z.pop(),Z.length===1&&U.parentNode?U.parentNode:U,Q(U));af=F.filter(ae.expr,ae.set);if(Z.length>0){ai=E(af)}else{X=false}while(Z.length){var ah=Z.pop(),ag=ah;if(!I.relative[ah]){ah=""}else{ag=Z.pop()}if(ag==null){ag=U}I.relative[ah](ai,ag,Q(U))}}if(!ai){ai=af}if(!ai){throw"Syntax error, unrecognized expression: "+(ah||Y)}if(H.call(ai)==="[object Array]"){if(!X){ab.push.apply(ab,ai)}else{if(U.nodeType===1){for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&(ai[aa]===true||ai[aa].nodeType===1&&K(U,ai[aa]))){ab.push(af[aa])}}}else{for(var aa=0;ai[aa]!=null;aa++){if(ai[aa]&&ai[aa].nodeType===1){ab.push(af[aa])}}}}}else{E(ai,ab)}if(V){F(V,U,ab,ac);if(G){hasDuplicate=false;ab.sort(G);if(hasDuplicate){for(var aa=1;aa<ab.length;aa++){if(ab[aa]===ab[aa-1]){ab.splice(aa--,1)}}}}}return ab};F.matches=function(T,U){return F(T,null,null,U)};F.find=function(aa,T,ab){var Z,X;if(!aa){return[]}for(var W=0,V=I.order.length;W<V;W++){var Y=I.order[W],X;if((X=I.match[Y].exec(aa))){var U=RegExp.leftContext;if(U.substr(U.length-1)!=="\\"){X[1]=(X[1]||"").replace(/\\/g,"");Z=I.find[Y](X,T,ab);if(Z!=null){aa=aa.replace(I.match[Y],"");break}}}}if(!Z){Z=T.getElementsByTagName("*")}return{set:Z,expr:aa}};F.filter=function(ad,ac,ag,W){var V=ad,ai=[],aa=ac,Y,T,Z=ac&&ac[0]&&Q(ac[0]);while(ad&&ac.length){for(var ab in I.filter){if((Y=I.match[ab].exec(ad))!=null){var U=I.filter[ab],ah,af;T=false;if(aa==ai){ai=[]}if(I.preFilter[ab]){Y=I.preFilter[ab](Y,aa,ag,ai,W,Z);if(!Y){T=ah=true}else{if(Y===true){continue}}}if(Y){for(var X=0;(af=aa[X])!=null;X++){if(af){ah=U(af,Y,X,aa);var ae=W^!!ah;if(ag&&ah!=null){if(ae){T=true}else{aa[X]=false}}else{if(ae){ai.push(af);T=true}}}}}if(ah!==g){if(!ag){aa=ai}ad=ad.replace(I.match[ab],"");if(!T){return[]}break}}}if(ad==V){if(T==null){throw"Syntax error, unrecognized expression: "+ad}else{break}}V=ad}return aa};var I=F.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(T){return T.getAttribute("href")}},relative:{"+":function(aa,T,Z){var X=typeof T==="string",ab=X&&!/\W/.test(T),Y=X&&!ab;if(ab&&!Z){T=T.toUpperCase()}for(var W=0,V=aa.length,U;W<V;W++){if((U=aa[W])){while((U=U.previousSibling)&&U.nodeType!==1){}aa[W]=Y||U&&U.nodeName===T?U||false:U===T}}if(Y){F.filter(T,aa,true)}},">":function(Z,U,aa){var X=typeof U==="string";if(X&&!/\W/.test(U)){U=aa?U:U.toUpperCase();for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){var W=Y.parentNode;Z[V]=W.nodeName===U?W:false}}}else{for(var V=0,T=Z.length;V<T;V++){var Y=Z[V];if(Y){Z[V]=X?Y.parentNode:Y.parentNode===U}}if(X){F.filter(U,Z,true)}}},"":function(W,U,Y){var V=L++,T=S;if(!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("parentNode",U,V,W,X,Y)},"~":function(W,U,Y){var V=L++,T=S;if(typeof U==="string"&&!U.match(/\W/)){var X=U=Y?U:U.toUpperCase();T=P}T("previousSibling",U,V,W,X,Y)}},find:{ID:function(U,V,W){if(typeof V.getElementById!=="undefined"&&!W){var T=V.getElementById(U[1]);return T?[T]:[]}},NAME:function(V,Y,Z){if(typeof Y.getElementsByName!=="undefined"){var U=[],X=Y.getElementsByName(V[1]);for(var W=0,T=X.length;W<T;W++){if(X[W].getAttribute("name")===V[1]){U.push(X[W])}}return U.length===0?null:U}},TAG:function(T,U){return U.getElementsByTagName(T[1])}},preFilter:{CLASS:function(W,U,V,T,Z,aa){W=" "+W[1].replace(/\\/g,"")+" ";if(aa){return W}for(var X=0,Y;(Y=U[X])!=null;X++){if(Y){if(Z^(Y.className&&(" "+Y.className+" ").indexOf(W)>=0)){if(!V){T.push(Y)}}else{if(V){U[X]=false}}}}return false},ID:function(T){return T[1].replace(/\\/g,"")},TAG:function(U,T){for(var V=0;T[V]===false;V++){}return T[V]&&Q(T[V])?U[1]:U[1].toUpperCase()},CHILD:function(T){if(T[1]=="nth"){var U=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(T[2]=="even"&&"2n"||T[2]=="odd"&&"2n+1"||!/\D/.test(T[2])&&"0n+"+T[2]||T[2]);T[2]=(U[1]+(U[2]||1))-0;T[3]=U[3]-0}T[0]=L++;return T},ATTR:function(X,U,V,T,Y,Z){var W=X[1].replace(/\\/g,"");if(!Z&&I.attrMap[W]){X[1]=I.attrMap[W]}if(X[2]==="~="){X[4]=" "+X[4]+" "}return X},PSEUDO:function(X,U,V,T,Y){if(X[1]==="not"){if(X[3].match(R).length>1||/^\w/.test(X[3])){X[3]=F(X[3],null,null,U)}else{var W=F.filter(X[3],U,V,true^Y);if(!V){T.push.apply(T,W)}return false}}else{if(I.match.POS.test(X[0])||I.match.CHILD.test(X[0])){return true}}return X},POS:function(T){T.unshift(true);return T}},filters:{enabled:function(T){return T.disabled===false&&T.type!=="hidden"},disabled:function(T){return T.disabled===true},checked:function(T){return T.checked===true},selected:function(T){T.parentNode.selectedIndex;return T.selected===true},parent:function(T){return !!T.firstChild},empty:function(T){return !T.firstChild},has:function(V,U,T){return !!F(T[3],V).length},header:function(T){return/h\d/i.test(T.nodeName)},text:function(T){return"text"===T.type},radio:function(T){return"radio"===T.type},checkbox:function(T){return"checkbox"===T.type},file:function(T){return"file"===T.type},password:function(T){return"password"===T.type},submit:function(T){return"submit"===T.type},image:function(T){return"image"===T.type},reset:function(T){return"reset"===T.type},button:function(T){return"button"===T.type||T.nodeName.toUpperCase()==="BUTTON"},input:function(T){return/input|select|textarea|button/i.test(T.nodeName)}},setFilters:{first:function(U,T){return T===0},last:function(V,U,T,W){return U===W.length-1},even:function(U,T){return T%2===0},odd:function(U,T){return T%2===1},lt:function(V,U,T){return U<T[3]-0},gt:function(V,U,T){return U>T[3]-0},nth:function(V,U,T){return T[3]-0==U},eq:function(V,U,T){return T[3]-0==U}},filter:{PSEUDO:function(Z,V,W,aa){var U=V[1],X=I.filters[U];if(X){return X(Z,W,V,aa)}else{if(U==="contains"){return(Z.textContent||Z.innerText||"").indexOf(V[3])>=0}else{if(U==="not"){var Y=V[3];for(var W=0,T=Y.length;W<T;W++){if(Y[W]===Z){return false}}return true}}}},CHILD:function(T,W){var Z=W[1],U=T;switch(Z){case"only":case"first":while(U=U.previousSibling){if(U.nodeType===1){return false}}if(Z=="first"){return true}U=T;case"last":while(U=U.nextSibling){if(U.nodeType===1){return false}}return true;case"nth":var V=W[2],ac=W[3];if(V==1&&ac==0){return true}var Y=W[0],ab=T.parentNode;if(ab&&(ab.sizcache!==Y||!T.nodeIndex)){var X=0;for(U=ab.firstChild;U;U=U.nextSibling){if(U.nodeType===1){U.nodeIndex=++X}}ab.sizcache=Y}var aa=T.nodeIndex-ac;if(V==0){return aa==0}else{return(aa%V==0&&aa/V>=0)}}},ID:function(U,T){return U.nodeType===1&&U.getAttribute("id")===T},TAG:function(U,T){return(T==="*"&&U.nodeType===1)||U.nodeName===T},CLASS:function(U,T){return(" "+(U.className||U.getAttribute("class"))+" ").indexOf(T)>-1},ATTR:function(Y,W){var V=W[1],T=I.attrHandle[V]?I.attrHandle[V](Y):Y[V]!=null?Y[V]:Y.getAttribute(V),Z=T+"",X=W[2],U=W[4];return T==null?X==="!=":X==="="?Z===U:X==="*="?Z.indexOf(U)>=0:X==="~="?(" "+Z+" ").indexOf(U)>=0:!U?Z&&T!==false:X==="!="?Z!=U:X==="^="?Z.indexOf(U)===0:X==="$="?Z.substr(Z.length-U.length)===U:X==="|="?Z===U||Z.substr(0,U.length+1)===U+"-":false},POS:function(X,U,V,Y){var T=U[2],W=I.setFilters[T];if(W){return W(X,V,U,Y)}}}};var M=I.match.POS;for(var O in I.match){I.match[O]=RegExp(I.match[O].source+/(?![^\[]*\])(?![^\(]*\))/.source)}var E=function(U,T){U=Array.prototype.slice.call(U);if(T){T.push.apply(T,U);return T}return U};try{Array.prototype.slice.call(document.documentElement.childNodes)}catch(N){E=function(X,W){var U=W||[];if(H.call(X)==="[object Array]"){Array.prototype.push.apply(U,X)}else{if(typeof X.length==="number"){for(var V=0,T=X.length;V<T;V++){U.push(X[V])}}else{for(var V=0;X[V];V++){U.push(X[V])}}}return U}}var G;if(document.documentElement.compareDocumentPosition){G=function(U,T){var V=U.compareDocumentPosition(T)&4?-1:U===T?0:1;if(V===0){hasDuplicate=true}return V}}else{if("sourceIndex" in document.documentElement){G=function(U,T){var V=U.sourceIndex-T.sourceIndex;if(V===0){hasDuplicate=true}return V}}else{if(document.createRange){G=function(W,U){var V=W.ownerDocument.createRange(),T=U.ownerDocument.createRange();V.selectNode(W);V.collapse(true);T.selectNode(U);T.collapse(true);var X=V.compareBoundaryPoints(Range.START_TO_END,T);if(X===0){hasDuplicate=true}return X}}}}(function(){var U=document.createElement("form"),V="script"+(new Date).getTime();U.innerHTML="<input name='"+V+"'/>";var T=document.documentElement;T.insertBefore(U,T.firstChild);if(!!document.getElementById(V)){I.find.ID=function(X,Y,Z){if(typeof Y.getElementById!=="undefined"&&!Z){var W=Y.getElementById(X[1]);return W?W.id===X[1]||typeof W.getAttributeNode!=="undefined"&&W.getAttributeNode("id").nodeValue===X[1]?[W]:g:[]}};I.filter.ID=function(Y,W){var X=typeof Y.getAttributeNode!=="undefined"&&Y.getAttributeNode("id");return Y.nodeType===1&&X&&X.nodeValue===W}}T.removeChild(U)})();(function(){var T=document.createElement("div");T.appendChild(document.createComment(""));if(T.getElementsByTagName("*").length>0){I.find.TAG=function(U,Y){var X=Y.getElementsByTagName(U[1]);if(U[1]==="*"){var W=[];for(var V=0;X[V];V++){if(X[V].nodeType===1){W.push(X[V])}}X=W}return X}}T.innerHTML="<a href='#'></a>";if(T.firstChild&&typeof T.firstChild.getAttribute!=="undefined"&&T.firstChild.getAttribute("href")!=="#"){I.attrHandle.href=function(U){return U.getAttribute("href",2)}}})();if(document.querySelectorAll){(function(){var T=F,U=document.createElement("div");U.innerHTML="<p class='TEST'></p>";if(U.querySelectorAll&&U.querySelectorAll(".TEST").length===0){return}F=function(Y,X,V,W){X=X||document;if(!W&&X.nodeType===9&&!Q(X)){try{return E(X.querySelectorAll(Y),V)}catch(Z){}}return T(Y,X,V,W)};F.find=T.find;F.filter=T.filter;F.selectors=T.selectors;F.matches=T.matches})()}if(document.getElementsByClassName&&document.documentElement.getElementsByClassName){(function(){var T=document.createElement("div");T.innerHTML="<div class='test e'></div><div class='test'></div>";if(T.getElementsByClassName("e").length===0){return}T.lastChild.className="e";if(T.getElementsByClassName("e").length===1){return}I.order.splice(1,0,"CLASS");I.find.CLASS=function(U,V,W){if(typeof V.getElementsByClassName!=="undefined"&&!W){return V.getElementsByClassName(U[1])}}})()}function P(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1&&!ac){T.sizcache=Y;T.sizset=W}if(T.nodeName===Z){X=T;break}T=T[U]}ad[W]=X}}}function S(U,Z,Y,ad,aa,ac){var ab=U=="previousSibling"&&!ac;for(var W=0,V=ad.length;W<V;W++){var T=ad[W];if(T){if(ab&&T.nodeType===1){T.sizcache=Y;T.sizset=W}T=T[U];var X=false;while(T){if(T.sizcache===Y){X=ad[T.sizset];break}if(T.nodeType===1){if(!ac){T.sizcache=Y;T.sizset=W}if(typeof Z!=="string"){if(T===Z){X=true;break}}else{if(F.filter(Z,[T]).length>0){X=T;break}}}T=T[U]}ad[W]=X}}}var K=document.compareDocumentPosition?function(U,T){return U.compareDocumentPosition(T)&16}:function(U,T){return U!==T&&(U.contains?U.contains(T):true)};var Q=function(T){return T.nodeType===9&&T.documentElement.nodeName!=="HTML"||!!T.ownerDocument&&Q(T.ownerDocument)};var J=function(T,aa){var W=[],X="",Y,V=aa.nodeType?[aa]:aa;while((Y=I.match.PSEUDO.exec(T))){X+=Y[0];T=T.replace(I.match.PSEUDO,"")}T=I.relative[T]?T+"*":T;for(var Z=0,U=V.length;Z<U;Z++){F(T,V[Z],W)}return F.filter(X,W)};o.find=F;o.filter=F.filter;o.expr=F.selectors;o.expr[":"]=o.expr.filters;F.selectors.filters.hidden=function(T){return T.offsetWidth===0||T.offsetHeight===0};F.selectors.filters.visible=function(T){return T.offsetWidth>0||T.offsetHeight>0};F.selectors.filters.animated=function(T){return o.grep(o.timers,function(U){return T===U.elem}).length};o.multiFilter=function(V,T,U){if(U){V=":not("+V+")"}return F.matches(V,T)};o.dir=function(V,U){var T=[],W=V[U];while(W&&W!=document){if(W.nodeType==1){T.push(W)}W=W[U]}return T};o.nth=function(X,T,V,W){T=T||1;var U=0;for(;X;X=X[V]){if(X.nodeType==1&&++U==T){break}}return X};o.sibling=function(V,U){var T=[];for(;V;V=V.nextSibling){if(V.nodeType==1&&V!=U){T.push(V)}}return T};return;l.Sizzle=F})();o.event={add:function(I,F,H,K){if(I.nodeType==3||I.nodeType==8){return}if(I.setInterval&&I!=l){I=l}if(!H.guid){H.guid=this.guid++}if(K!==g){var G=H;H=this.proxy(G);H.data=K}var E=o.data(I,"events")||o.data(I,"events",{}),J=o.data(I,"handle")||o.data(I,"handle",function(){return typeof o!=="undefined"&&!o.event.triggered?o.event.handle.apply(arguments.callee.elem,arguments):g});J.elem=I;o.each(F.split(/\s+/),function(M,N){var O=N.split(".");N=O.shift();H.type=O.slice().sort().join(".");var L=E[N];if(o.event.specialAll[N]){o.event.specialAll[N].setup.call(I,K,O)}if(!L){L=E[N]={};if(!o.event.special[N]||o.event.special[N].setup.call(I,K,O)===false){if(I.addEventListener){I.addEventListener(N,J,false)}else{if(I.attachEvent){I.attachEvent("on"+N,J)}}}}L[H.guid]=H;o.event.global[N]=true});I=null},guid:1,global:{},remove:function(K,H,J){if(K.nodeType==3||K.nodeType==8){return}var G=o.data(K,"events"),F,E;if(G){if(H===g||(typeof H==="string"&&H.charAt(0)==".")){for(var I in G){this.remove(K,I+(H||""))}}else{if(H.type){J=H.handler;H=H.type}o.each(H.split(/\s+/),function(M,O){var Q=O.split(".");O=Q.shift();var N=RegExp("(^|\\.)"+Q.slice().sort().join(".*\\.")+"(\\.|$)");if(G[O]){if(J){delete G[O][J.guid]}else{for(var P in G[O]){if(N.test(G[O][P].type)){delete G[O][P]}}}if(o.event.specialAll[O]){o.event.specialAll[O].teardown.call(K,Q)}for(F in G[O]){break}if(!F){if(!o.event.special[O]||o.event.special[O].teardown.call(K,Q)===false){if(K.removeEventListener){K.removeEventListener(O,o.data(K,"handle"),false)}else{if(K.detachEvent){K.detachEvent("on"+O,o.data(K,"handle"))}}}F=null;delete G[O]}}})}for(F in G){break}if(!F){var L=o.data(K,"handle");if(L){L.elem=null}o.removeData(K,"events");o.removeData(K,"handle")}}},trigger:function(I,K,H,E){var G=I.type||I;if(!E){I=typeof I==="object"?I[h]?I:o.extend(o.Event(G),I):o.Event(G);if(G.indexOf("!")>=0){I.type=G=G.slice(0,-1);I.exclusive=true}if(!H){I.stopPropagation();if(this.global[G]){o.each(o.cache,function(){if(this.events&&this.events[G]){o.event.trigger(I,K,this.handle.elem)}})}}if(!H||H.nodeType==3||H.nodeType==8){return g}I.result=g;I.target=H;K=o.makeArray(K);K.unshift(I)}I.currentTarget=H;var J=o.data(H,"handle");if(J){J.apply(H,K)}if((!H[G]||(o.nodeName(H,"a")&&G=="click"))&&H["on"+G]&&H["on"+G].apply(H,K)===false){I.result=false}if(!E&&H[G]&&!I.isDefaultPrevented()&&!(o.nodeName(H,"a")&&G=="click")){this.triggered=true;try{H[G]()}catch(L){}}this.triggered=false;if(!I.isPropagationStopped()){var F=H.parentNode||H.ownerDocument;if(F){o.event.trigger(I,K,F,true)}}},handle:function(K){var J,E;K=arguments[0]=o.event.fix(K||l.event);K.currentTarget=this;var L=K.type.split(".");K.type=L.shift();J=!L.length&&!K.exclusive;var I=RegExp("(^|\\.)"+L.slice().sort().join(".*\\.")+"(\\.|$)");E=(o.data(this,"events")||{})[K.type];for(var G in E){var H=E[G];if(J||I.test(H.type)){K.handler=H;K.data=H.data;var F=H.apply(this,arguments);if(F!==g){K.result=F;if(F===false){K.preventDefault();K.stopPropagation()}}if(K.isImmediatePropagationStopped()){break}}}},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(H){if(H[h]){return H}var F=H;H=o.Event(F);for(var G=this.props.length,J;G;){J=this.props[--G];H[J]=F[J]}if(!H.target){H.target=H.srcElement||document}if(H.target.nodeType==3){H.target=H.target.parentNode}if(!H.relatedTarget&&H.fromElement){H.relatedTarget=H.fromElement==H.target?H.toElement:H.fromElement}if(H.pageX==null&&H.clientX!=null){var I=document.documentElement,E=document.body;H.pageX=H.clientX+(I&&I.scrollLeft||E&&E.scrollLeft||0)-(I.clientLeft||0);H.pageY=H.clientY+(I&&I.scrollTop||E&&E.scrollTop||0)-(I.clientTop||0)}if(!H.which&&((H.charCode||H.charCode===0)?H.charCode:H.keyCode)){H.which=H.charCode||H.keyCode}if(!H.metaKey&&H.ctrlKey){H.metaKey=H.ctrlKey}if(!H.which&&H.button){H.which=(H.button&1?1:(H.button&2?3:(H.button&4?2:0)))}return H},proxy:function(F,E){E=E||function(){return F.apply(this,arguments)};E.guid=F.guid=F.guid||E.guid||this.guid++;return E},special:{ready:{setup:B,teardown:function(){}}},specialAll:{live:{setup:function(E,F){o.event.add(this,F[0],c)},teardown:function(G){if(G.length){var E=0,F=RegExp("(^|\\.)"+G[0]+"(\\.|$)");o.each((o.data(this,"events").live||{}),function(){if(F.test(this.type)){E++}});if(E<1){o.event.remove(this,G[0],c)}}}}}};o.Event=function(E){if(!this.preventDefault){return new o.Event(E)}if(E&&E.type){this.originalEvent=E;this.type=E.type}else{this.type=E}this.timeStamp=e();this[h]=true};function k(){return false}function u(){return true}o.Event.prototype={preventDefault:function(){this.isDefaultPrevented=u;var E=this.originalEvent;if(!E){return}if(E.preventDefault){E.preventDefault()}E.returnValue=false},stopPropagation:function(){this.isPropagationStopped=u;var E=this.originalEvent;if(!E){return}if(E.stopPropagation){E.stopPropagation()}E.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=u;this.stopPropagation()},isDefaultPrevented:k,isPropagationStopped:k,isImmediatePropagationStopped:k};var a=function(F){var E=F.relatedTarget;while(E&&E!=this){try{E=E.parentNode}catch(G){E=this}}if(E!=this){F.type=F.data;o.event.handle.apply(this,arguments)}};o.each({mouseover:"mouseenter",mouseout:"mouseleave"},function(F,E){o.event.special[E]={setup:function(){o.event.add(this,F,a,E)},teardown:function(){o.event.remove(this,F,a)}}});o.fn.extend({bind:function(F,G,E){return F=="unload"?this.one(F,G,E):this.each(function(){o.event.add(this,F,E||G,E&&G)})},one:function(G,H,F){var E=o.event.proxy(F||H,function(I){o(this).unbind(I,E);return(F||H).apply(this,arguments)});return this.each(function(){o.event.add(this,G,E,F&&H)})},unbind:function(F,E){return this.each(function(){o.event.remove(this,F,E)})},trigger:function(E,F){return this.each(function(){o.event.trigger(E,F,this)})},triggerHandler:function(E,G){if(this[0]){var F=o.Event(E);F.preventDefault();F.stopPropagation();o.event.trigger(F,G,this[0]);return F.result}},toggle:function(G){var E=arguments,F=1;while(F<E.length){o.event.proxy(G,E[F++])}return this.click(o.event.proxy(G,function(H){this.lastToggle=(this.lastToggle||0)%F;H.preventDefault();return E[this.lastToggle++].apply(this,arguments)||false}))},hover:function(E,F){return this.mouseenter(E).mouseleave(F)},ready:function(E){B();if(o.isReady){E.call(document,o)}else{o.readyList.push(E)}return this},live:function(G,F){var E=o.event.proxy(F);E.guid+=this.selector+G;o(document).bind(i(G,this.selector),this.selector,E);return this},die:function(F,E){o(document).unbind(i(F,this.selector),E?{guid:E.guid+this.selector+F}:null);return this}});function c(H){var E=RegExp("(^|\\.)"+H.type+"(\\.|$)"),G=true,F=[];o.each(o.data(this,"events").live||[],function(I,J){if(E.test(J.type)){var K=o(H.target).closest(J.data)[0];if(K){F.push({elem:K,fn:J})}}});F.sort(function(J,I){return o.data(J.elem,"closest")-o.data(I.elem,"closest")});o.each(F,function(){if(this.fn.call(this.elem,H,this.fn.data)===false){return(G=false)}});return G}function i(F,E){return["live",F,E.replace(/\./g,"`").replace(/ /g,"|")].join(".")}o.extend({isReady:false,readyList:[],ready:function(){if(!o.isReady){o.isReady=true;if(o.readyList){o.each(o.readyList,function(){this.call(document,o)});o.readyList=null}o(document).triggerHandler("ready")}}});var x=false;function B(){if(x){return}x=true;if(document.addEventListener){document.addEventListener("DOMContentLoaded",function(){document.removeEventListener("DOMContentLoaded",arguments.callee,false);o.ready()},false)}else{if(document.attachEvent){document.attachEvent("onreadystatechange",function(){if(document.readyState==="complete"){document.detachEvent("onreadystatechange",arguments.callee);o.ready()}});if(document.documentElement.doScroll&&l==l.top){(function(){if(o.isReady){return}try{document.documentElement.doScroll("left")}catch(E){setTimeout(arguments.callee,0);return}o.ready()})()}}}o.event.add(l,"load",o.ready)}o.each(("blur,focus,load,resize,scroll,unload,click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,change,select,submit,keydown,keypress,keyup,error").split(","),function(F,E){o.fn[E]=function(G){return G?this.bind(E,G):this.trigger(E)}});o(l).bind("unload",function(){for(var E in o.cache){if(E!=1&&o.cache[E].handle){o.event.remove(o.cache[E].handle.elem)}}});(function(){o.support={};var F=document.documentElement,G=document.createElement("script"),K=document.createElement("div"),J="script"+(new Date).getTime();K.style.display="none";K.innerHTML='   <link/><table></table><a href="/a" style="color:red;float:left;opacity:.5;">a</a><select><option>text</option></select><object><param/></object>';var H=K.getElementsByTagName("*"),E=K.getElementsByTagName("a")[0];if(!H||!H.length||!E){return}o.support={leadingWhitespace:K.firstChild.nodeType==3,tbody:!K.getElementsByTagName("tbody").length,objectAll:!!K.getElementsByTagName("object")[0].getElementsByTagName("*").length,htmlSerialize:!!K.getElementsByTagName("link").length,style:/red/.test(E.getAttribute("style")),hrefNormalized:E.getAttribute("href")==="/a",opacity:E.style.opacity==="0.5",cssFloat:!!E.style.cssFloat,scriptEval:false,noCloneEvent:true,boxModel:null};G.type="text/javascript";try{G.appendChild(document.createTextNode("window."+J+"=1;"))}catch(I){}F.insertBefore(G,F.firstChild);if(l[J]){o.support.scriptEval=true;delete l[J]}F.removeChild(G);if(K.attachEvent&&K.fireEvent){K.attachEvent("onclick",function(){o.support.noCloneEvent=false;K.detachEvent("onclick",arguments.callee)});K.cloneNode(true).fireEvent("onclick")}o(function(){var L=document.createElement("div");L.style.width=L.style.paddingLeft="1px";document.body.appendChild(L);o.boxModel=o.support.boxModel=L.offsetWidth===2;document.body.removeChild(L).style.display="none"})})();var w=o.support.cssFloat?"cssFloat":"styleFloat";o.props={"for":"htmlFor","class":"className","float":w,cssFloat:w,styleFloat:w,readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",tabindex:"tabIndex"};o.fn.extend({_load:o.fn.load,load:function(G,J,K){if(typeof G!=="string"){return this._load(G)}var I=G.indexOf(" ");if(I>=0){var E=G.slice(I,G.length);G=G.slice(0,I)}var H="GET";if(J){if(o.isFunction(J)){K=J;J=null}else{if(typeof J==="object"){J=o.param(J);H="POST"}}}var F=this;o.ajax({url:G,type:H,dataType:"html",data:J,complete:function(M,L){if(L=="success"||L=="notmodified"){F.html(E?o("<div/>").append(M.responseText.replace(/<script(.|\s)*?\/script>/g,"")).find(E):M.responseText)}if(K){F.each(K,[M.responseText,L,M])}}});return this},serialize:function(){return o.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?o.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||/select|textarea/i.test(this.nodeName)||/text|hidden|password|search/i.test(this.type))}).map(function(E,F){var G=o(this).val();return G==null?null:o.isArray(G)?o.map(G,function(I,H){return{name:F.name,value:I}}):{name:F.name,value:G}}).get()}});o.each("ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","),function(E,F){o.fn[F]=function(G){return this.bind(F,G)}});var r=e();o.extend({get:function(E,G,H,F){if(o.isFunction(G)){H=G;G=null}return o.ajax({type:"GET",url:E,data:G,success:H,dataType:F})},getScript:function(E,F){return o.get(E,null,F,"script")},getJSON:function(E,F,G){return o.get(E,F,G,"json")},post:function(E,G,H,F){if(o.isFunction(G)){H=G;G={}}return o.ajax({type:"POST",url:E,data:G,success:H,dataType:F})},ajaxSetup:function(E){o.extend(o.ajaxSettings,E)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return l.ActiveXObject?new ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest()},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},ajax:function(M){M=o.extend(true,M,o.extend(true,{},o.ajaxSettings,M));var W,F=/=\?(&|$)/g,R,V,G=M.type.toUpperCase();if(M.data&&M.processData&&typeof M.data!=="string"){M.data=o.param(M.data)}if(M.dataType=="jsonp"){if(G=="GET"){if(!M.url.match(F)){M.url+=(M.url.match(/\?/)?"&":"?")+(M.jsonp||"callback")+"=?"}}else{if(!M.data||!M.data.match(F)){M.data=(M.data?M.data+"&":"")+(M.jsonp||"callback")+"=?"}}M.dataType="json"}if(M.dataType=="json"&&(M.data&&M.data.match(F)||M.url.match(F))){W="jsonp"+r++;if(M.data){M.data=(M.data+"").replace(F,"="+W+"$1")}M.url=M.url.replace(F,"="+W+"$1");M.dataType="script";l[W]=function(X){V=X;I();L();l[W]=g;try{delete l[W]}catch(Y){}if(H){H.removeChild(T)}}}if(M.dataType=="script"&&M.cache==null){M.cache=false}if(M.cache===false&&G=="GET"){var E=e();var U=M.url.replace(/(\?|&)_=.*?(&|$)/,"$1_="+E+"$2");M.url=U+((U==M.url)?(M.url.match(/\?/)?"&":"?")+"_="+E:"")}if(M.data&&G=="GET"){M.url+=(M.url.match(/\?/)?"&":"?")+M.data;M.data=null}if(M.global&&!o.active++){o.event.trigger("ajaxStart")}var Q=/^(\w+:)?\/\/([^\/?#]+)/.exec(M.url);if(M.dataType=="script"&&G=="GET"&&Q&&(Q[1]&&Q[1]!=location.protocol||Q[2]!=location.host)){var H=document.getElementsByTagName("head")[0];var T=document.createElement("script");T.src=M.url;if(M.scriptCharset){T.charset=M.scriptCharset}if(!W){var O=false;T.onload=T.onreadystatechange=function(){if(!O&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){O=true;I();L();T.onload=T.onreadystatechange=null;H.removeChild(T)}}}H.appendChild(T);return g}var K=false;var J=M.xhr();if(M.username){J.open(G,M.url,M.async,M.username,M.password)}else{J.open(G,M.url,M.async)}try{if(M.data){J.setRequestHeader("Content-Type",M.contentType)}if(M.ifModified){J.setRequestHeader("If-Modified-Since",o.lastModified[M.url]||"Thu, 01 Jan 1970 00:00:00 GMT")}J.setRequestHeader("X-Requested-With","XMLHttpRequest");J.setRequestHeader("Accept",M.dataType&&M.accepts[M.dataType]?M.accepts[M.dataType]+", */*":M.accepts._default)}catch(S){}if(M.beforeSend&&M.beforeSend(J,M)===false){if(M.global&&!--o.active){o.event.trigger("ajaxStop")}J.abort();return false}if(M.global){o.event.trigger("ajaxSend",[J,M])}var N=function(X){if(J.readyState==0){if(P){clearInterval(P);P=null;if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}}else{if(!K&&J&&(J.readyState==4||X=="timeout")){K=true;if(P){clearInterval(P);P=null}R=X=="timeout"?"timeout":!o.httpSuccess(J)?"error":M.ifModified&&o.httpNotModified(J,M.url)?"notmodified":"success";if(R=="success"){try{V=o.httpData(J,M.dataType,M)}catch(Z){R="parsererror"}}if(R=="success"){var Y;try{Y=J.getResponseHeader("Last-Modified")}catch(Z){}if(M.ifModified&&Y){o.lastModified[M.url]=Y}if(!W){I()}}else{o.handleError(M,J,R)}L();if(X){J.abort()}if(M.async){J=null}}}};if(M.async){var P=setInterval(N,13);if(M.timeout>0){setTimeout(function(){if(J&&!K){N("timeout")}},M.timeout)}}try{J.send(M.data)}catch(S){o.handleError(M,J,null,S)}if(!M.async){N()}function I(){if(M.success){M.success(V,R)}if(M.global){o.event.trigger("ajaxSuccess",[J,M])}}function L(){if(M.complete){M.complete(J,R)}if(M.global){o.event.trigger("ajaxComplete",[J,M])}if(M.global&&!--o.active){o.event.trigger("ajaxStop")}}return J},handleError:function(F,H,E,G){if(F.error){F.error(H,E,G)}if(F.global){o.event.trigger("ajaxError",[H,F,G])}},active:0,httpSuccess:function(F){try{return !F.status&&location.protocol=="file:"||(F.status>=200&&F.status<300)||F.status==304||F.status==1223}catch(E){}return false},httpNotModified:function(G,E){try{var H=G.getResponseHeader("Last-Modified");return G.status==304||H==o.lastModified[E]}catch(F){}return false},httpData:function(J,H,G){var F=J.getResponseHeader("content-type"),E=H=="xml"||!H&&F&&F.indexOf("xml")>=0,I=E?J.responseXML:J.responseText;if(E&&I.documentElement.tagName=="parsererror"){throw"parsererror"}if(G&&G.dataFilter){I=G.dataFilter(I,H)}if(typeof I==="string"){if(H=="script"){o.globalEval(I)}if(H=="json"){I=l["eval"]("("+I+")")}}return I},param:function(E){var G=[];function H(I,J){G[G.length]=encodeURIComponent(I)+"="+encodeURIComponent(J)}if(o.isArray(E)||E.jquery){o.each(E,function(){H(this.name,this.value)})}else{for(var F in E){if(o.isArray(E[F])){o.each(E[F],function(){H(F,this)})}else{H(F,o.isFunction(E[F])?E[F]():E[F])}}}return G.join("&").replace(/%20/g,"+")}});var m={},n,d=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];function t(F,E){var G={};o.each(d.concat.apply([],d.slice(0,E)),function(){G[this]=F});return G}o.fn.extend({show:function(J,L){if(J){return this.animate(t("show",3),J,L)}else{for(var H=0,F=this.length;H<F;H++){var E=o.data(this[H],"olddisplay");this[H].style.display=E||"";if(o.css(this[H],"display")==="none"){var G=this[H].tagName,K;if(m[G]){K=m[G]}else{var I=o("<"+G+" />").appendTo("body");K=I.css("display");if(K==="none"){K="block"}I.remove();m[G]=K}o.data(this[H],"olddisplay",K)}}for(var H=0,F=this.length;H<F;H++){this[H].style.display=o.data(this[H],"olddisplay")||""}return this}},hide:function(H,I){if(H){return this.animate(t("hide",3),H,I)}else{for(var G=0,F=this.length;G<F;G++){var E=o.data(this[G],"olddisplay");if(!E&&E!=="none"){o.data(this[G],"olddisplay",o.css(this[G],"display"))}}for(var G=0,F=this.length;G<F;G++){this[G].style.display="none"}return this}},_toggle:o.fn.toggle,toggle:function(G,F){var E=typeof G==="boolean";return o.isFunction(G)&&o.isFunction(F)?this._toggle.apply(this,arguments):G==null||E?this.each(function(){var H=E?G:o(this).is(":hidden");o(this)[H?"show":"hide"]()}):this.animate(t("toggle",3),G,F)},fadeTo:function(E,G,F){return this.animate({opacity:G},E,F)},animate:function(I,F,H,G){var E=o.speed(F,H,G);return this[E.queue===false?"each":"queue"](function(){var K=o.extend({},E),M,L=this.nodeType==1&&o(this).is(":hidden"),J=this;for(M in I){if(I[M]=="hide"&&L||I[M]=="show"&&!L){return K.complete.call(this)}if((M=="height"||M=="width")&&this.style){K.display=o.css(this,"display");K.overflow=this.style.overflow}}if(K.overflow!=null){this.style.overflow="hidden"}K.curAnim=o.extend({},I);o.each(I,function(O,S){var R=new o.fx(J,K,O);if(/toggle|show|hide/.test(S)){R[S=="toggle"?L?"show":"hide":S](I)}else{var Q=S.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),T=R.cur(true)||0;if(Q){var N=parseFloat(Q[2]),P=Q[3]||"px";if(P!="px"){J.style[O]=(N||1)+P;T=((N||1)/R.cur(true))*T;J.style[O]=T+P}if(Q[1]){N=((Q[1]=="-="?-1:1)*N)+T}R.custom(T,N,P)}else{R.custom(T,S,"")}}});return true})},stop:function(F,E){var G=o.timers;if(F){this.queue([])}this.each(function(){for(var H=G.length-1;H>=0;H--){if(G[H].elem==this){if(E){G[H](true)}G.splice(H,1)}}});if(!E){this.dequeue()}return this}});o.each({slideDown:t("show",1),slideUp:t("hide",1),slideToggle:t("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(E,F){o.fn[E]=function(G,H){return this.animate(F,G,H)}});o.extend({speed:function(G,H,F){var E=typeof G==="object"?G:{complete:F||!F&&H||o.isFunction(G)&&G,duration:G,easing:F&&H||H&&!o.isFunction(H)&&H};E.duration=o.fx.off?0:typeof E.duration==="number"?E.duration:o.fx.speeds[E.duration]||o.fx.speeds._default;E.old=E.complete;E.complete=function(){if(E.queue!==false){o(this).dequeue()}if(o.isFunction(E.old)){E.old.call(this)}};return E},easing:{linear:function(G,H,E,F){return E+F*G},swing:function(G,H,E,F){return((-Math.cos(G*Math.PI)/2)+0.5)*F+E}},timers:[],fx:function(F,E,G){this.options=E;this.elem=F;this.prop=G;if(!E.orig){E.orig={}}}});o.fx.prototype={update:function(){if(this.options.step){this.options.step.call(this.elem,this.now,this)}(o.fx.step[this.prop]||o.fx.step._default)(this);if((this.prop=="height"||this.prop=="width")&&this.elem.style){this.elem.style.display="block"}},cur:function(F){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null)){return this.elem[this.prop]}var E=parseFloat(o.css(this.elem,this.prop,F));return E&&E>-10000?E:parseFloat(o.curCSS(this.elem,this.prop))||0},custom:function(I,H,G){this.startTime=e();this.start=I;this.end=H;this.unit=G||this.unit||"px";this.now=this.start;this.pos=this.state=0;var E=this;function F(J){return E.step(J)}F.elem=this.elem;if(F()&&o.timers.push(F)&&!n){n=setInterval(function(){var K=o.timers;for(var J=0;J<K.length;J++){if(!K[J]()){K.splice(J--,1)}}if(!K.length){clearInterval(n);n=g}},13)}},show:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.show=true;this.custom(this.prop=="width"||this.prop=="height"?1:0,this.cur());o(this.elem).show()},hide:function(){this.options.orig[this.prop]=o.attr(this.elem.style,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(H){var G=e();if(H||G>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;var E=true;for(var F in this.options.curAnim){if(this.options.curAnim[F]!==true){E=false}}if(E){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;this.elem.style.display=this.options.display;if(o.css(this.elem,"display")=="none"){this.elem.style.display="block"}}if(this.options.hide){o(this.elem).hide()}if(this.options.hide||this.options.show){for(var I in this.options.curAnim){o.attr(this.elem.style,I,this.options.orig[I])}}this.options.complete.call(this.elem)}return false}else{var J=G-this.startTime;this.state=J/this.options.duration;this.pos=o.easing[this.options.easing||(o.easing.swing?"swing":"linear")](this.state,J,0,1,this.options.duration);this.now=this.start+((this.end-this.start)*this.pos);this.update()}return true}};o.extend(o.fx,{speeds:{slow:600,fast:200,_default:400},step:{opacity:function(E){o.attr(E.elem.style,"opacity",E.now)},_default:function(E){if(E.elem.style&&E.elem.style[E.prop]!=null){E.elem.style[E.prop]=E.now+E.unit}else{E.elem[E.prop]=E.now}}}});if(document.documentElement.getBoundingClientRect){o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}var G=this[0].getBoundingClientRect(),J=this[0].ownerDocument,F=J.body,E=J.documentElement,L=E.clientTop||F.clientTop||0,K=E.clientLeft||F.clientLeft||0,I=G.top+(self.pageYOffset||o.boxModel&&E.scrollTop||F.scrollTop)-L,H=G.left+(self.pageXOffset||o.boxModel&&E.scrollLeft||F.scrollLeft)-K;return{top:I,left:H}}}else{o.fn.offset=function(){if(!this[0]){return{top:0,left:0}}if(this[0]===this[0].ownerDocument.body){return o.offset.bodyOffset(this[0])}o.offset.initialized||o.offset.initialize();var J=this[0],G=J.offsetParent,F=J,O=J.ownerDocument,M,H=O.documentElement,K=O.body,L=O.defaultView,E=L.getComputedStyle(J,null),N=J.offsetTop,I=J.offsetLeft;while((J=J.parentNode)&&J!==K&&J!==H){M=L.getComputedStyle(J,null);N-=J.scrollTop,I-=J.scrollLeft;if(J===G){N+=J.offsetTop,I+=J.offsetLeft;if(o.offset.doesNotAddBorder&&!(o.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(J.tagName))){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}F=G,G=J.offsetParent}if(o.offset.subtractsBorderForOverflowNotVisible&&M.overflow!=="visible"){N+=parseInt(M.borderTopWidth,10)||0,I+=parseInt(M.borderLeftWidth,10)||0}E=M}if(E.position==="relative"||E.position==="static"){N+=K.offsetTop,I+=K.offsetLeft}if(E.position==="fixed"){N+=Math.max(H.scrollTop,K.scrollTop),I+=Math.max(H.scrollLeft,K.scrollLeft)}return{top:N,left:I}}}o.offset={initialize:function(){if(this.initialized){return}var L=document.body,F=document.createElement("div"),H,G,N,I,M,E,J=L.style.marginTop,K='<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';M={position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"};for(E in M){F.style[E]=M[E]}F.innerHTML=K;L.insertBefore(F,L.firstChild);H=F.firstChild,G=H.firstChild,I=H.nextSibling.firstChild.firstChild;this.doesNotAddBorder=(G.offsetTop!==5);this.doesAddBorderForTableAndCells=(I.offsetTop===5);H.style.overflow="hidden",H.style.position="relative";this.subtractsBorderForOverflowNotVisible=(G.offsetTop===-5);L.style.marginTop="1px";this.doesNotIncludeMarginInBodyOffset=(L.offsetTop===0);L.style.marginTop=J;L.removeChild(F);this.initialized=true},bodyOffset:function(E){o.offset.initialized||o.offset.initialize();var G=E.offsetTop,F=E.offsetLeft;if(o.offset.doesNotIncludeMarginInBodyOffset){G+=parseInt(o.curCSS(E,"marginTop",true),10)||0,F+=parseInt(o.curCSS(E,"marginLeft",true),10)||0}return{top:G,left:F}}};o.fn.extend({position:function(){var I=0,H=0,F;if(this[0]){var G=this.offsetParent(),J=this.offset(),E=/^body|html$/i.test(G[0].tagName)?{top:0,left:0}:G.offset();J.top-=j(this,"marginTop");J.left-=j(this,"marginLeft");E.top+=j(G,"borderTopWidth");E.left+=j(G,"borderLeftWidth");F={top:J.top-E.top,left:J.left-E.left}}return F},offsetParent:function(){var E=this[0].offsetParent||document.body;while(E&&(!/^body|html$/i.test(E.tagName)&&o.css(E,"position")=="static")){E=E.offsetParent}return o(E)}});o.each(["Left","Top"],function(F,E){var G="scroll"+E;o.fn[G]=function(H){if(!this[0]){return null}return H!==g?this.each(function(){this==l||this==document?l.scrollTo(!F?H:o(l).scrollLeft(),F?H:o(l).scrollTop()):this[G]=H}):this[0]==l||this[0]==document?self[F?"pageYOffset":"pageXOffset"]||o.boxModel&&document.documentElement[G]||document.body[G]:this[0][G]}});o.each(["Height","Width"],function(I,G){var E=I?"Left":"Top",H=I?"Right":"Bottom",F=G.toLowerCase();o.fn["inner"+G]=function(){return this[0]?o.css(this[0],F,false,"padding"):null};o.fn["outer"+G]=function(K){return this[0]?o.css(this[0],F,false,K?"margin":"border"):null};var J=G.toLowerCase();o.fn[J]=function(K){return this[0]==l?document.compatMode=="CSS1Compat"&&document.documentElement["client"+G]||document.body["client"+G]:this[0]==document?Math.max(document.documentElement["client"+G],document.body["scroll"+G],document.documentElement["scroll"+G],document.body["offset"+G],document.documentElement["offset"+G]):K===g?(this.length?o.css(this[0],J):null):this.css(J,typeof K==="string"?K:K+"px")}})})();var local = {
  wheel: function(direction){
    if (Globals.selected === undefined) {
      tmp('Nothing selected');
      return;
    }
    Globals.selected.wheel(document.getElementById('dist').value, direction);
    if (direction === Constants.RIGHT) {
      // This right here is a horrible hack.
      // There is something wrong with
      // wheeling right then moving. So we
      // bump it to the left so we can move.
      // TODO: Fix this. This is not acceptable.
      Globals.selected.wheel(.0000000000000000001, Constants.LEFT);
    }
    Globals.selected.describe();
  },
  move: function(direction){
    if (Globals.selected === undefined) {
      tmp('Nothing selected');
      return;
    }
    Globals.selected.move(document.getElementById('dist').value, direction);

    Globals.selected.describe();
  },
  create_unit: function(base_size){
    var base;
    switch (base_size){
    case '20mm':
      base = base_20mm;
      break;
    case '25mm':
      base = base_25mm;
      break;
    case '40mm':
      base = base_40mm;
      break;
    case '50mm':
      base = base_50mm;
      break;
    case 'Chariot':
      base = base_Chariot;
      break;
    case 'Cavalry':
      base = base_Cavalry;
      break;
    default:
      throw new Error('No base specified');
    }
    Globals.queued_unit = {
      files: $('#files').val(),
      model_count: $('#models').val(),
      base: base,
      x: 0,
      y: 0,
      fill_color: '#' + $('#color').val()
    };
    }
};

function create_unit(base_size){
    var base;
    switch (base_size){
    case '20mm':
      base = base_20mm;
      break;
    case '25mm':
      base = base_25mm;
      break;
    case '40mm':
      base = base_40mm;
      break;
    case '50mm':
      base = base_50mm;
      break;
    case 'Chariot':
      base = base_Chariot;
      break;
    case 'Cavalry':
      base = base_Cavalry;
      break;
    default:
      throw new Error('No base specified');
    }
    var files = $('#files').val();
    var models = $('#models').val();
  var fill = $('#fill').val();
  if (fill == '' || fill === undefined){
    fill = 'transparent';
  }
  if (files === 0){
    tmp('Enter frontage!');
  } else if (models === 0){
    tmp('Enter # of models!');
  } else {
    tmp('Now select a point on the map');
  }
    Globals.queued_unit = {
      files: files,
      model_count: models,
      base: base,
      x: 0,
      y: 0,
      fill_color: fill
    };
}
