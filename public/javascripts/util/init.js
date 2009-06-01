$(document).ready(function(){
  Globals.paper = Raphael(10, 10, Constants.paper.WIDTH, Constants.paper.HEIGHT);
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
