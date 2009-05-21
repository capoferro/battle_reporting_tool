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
