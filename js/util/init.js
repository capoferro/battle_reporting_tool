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

  // TODO: Remove
  scratch(paper);

};
