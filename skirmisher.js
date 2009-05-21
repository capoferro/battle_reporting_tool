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

  var wheel = 3;
  var move = 10;
  var models = 5;
  var files = 5;
  var left = false;
  tmp('-----5--purple---');
  var test_unit5 = new Unit({
  			  files: files,
  			  model_count: models,
  			  base: base_25mm,
  			  x: 100,
  			  y: 300,
			  fill_color: 'purple'
  			}, paper);
  test_unit5.wheel(wheel, left);

  tmp('-----6--blue---');
  var test_unit6 = new Unit({
  			  files: files,
  			  model_count: models,
  			  base: base_cavalry,
  			  x: 100,
  			  y: 300,
			  fill_color: 'blue'
  			}, paper);
  test_unit6.wheel(wheel, left);
  test_unit5.move(move);
 };


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