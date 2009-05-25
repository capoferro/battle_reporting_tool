window.onload = function(){
  /**
   * The rendering target.
   */
   var paper = Raphael(10, 50, 740, 500);
  paper.$ = $('svg');
  Globals.paper = paper;

  /**
   * The field.
   * TODO: Use the Field constructor
   */
  Globals.field_width = 740;
  Globals.field_height = 500;
   Globals.field = paper.rect(0, 0, Globals.field_width, Globals.field_height);
   Globals.field.attr("stroke", "black");
   Globals.field.attr("stroke-width", 10);
   Globals.field.attr("fill", "#080");
  var last_unit;
  Globals.field.node.onclick = function(){
    if (Globals.queued_unit !== undefined){
      Globals.queued_unit.x = Globals.mouse.x;
      Globals.queued_unit.y = Globals.mouse.y;
      last_unit = new Unit(Globals.queued_unit, Globals.paper);
      Globals.queued_unit = undefined;
    } else {
      Ruler.toggle();
    }
  };

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


};
