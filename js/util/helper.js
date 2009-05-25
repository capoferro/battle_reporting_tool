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

function tmp(str){
  var tmp = $('#out');
  tmp.html(str);

}
function tmp2(str){
  $('#out').html(str);
}
jQuery(document).ready(function(){
			 $().mousemove(function(e){
					 Globals.mouse.x = e.pageX - Globals.paper.$.position().left;
					 Globals.mouse.y = e.pageY - Globals.paper.$.position().top;
				       });
		       });

var Globals = {
  field: undefined,
  selected: undefined,
  mouse: {
    x: 0,
    y: 0
  }
};
var Constants = {
  LEFT: -1,
  UP: -1,
  RIGHT: 1,
  DOWN: 1,
  FORWARD: -1,
  BACKWARD: 1,
  MISSING_VALUES_MESSAGE: 'Config is missing: '
};

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
