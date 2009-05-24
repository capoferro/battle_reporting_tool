function scratch(paper){
  var wheel = 4;
  var move = 5;
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
  test_unit5.wheel(wheel, Constants.RIGHT);
  test_unit5.wheel(2, Constants.LEFT);
  test_unit5.move(3, true);
  //   tmp('-----5--purple---');
  // var test_unit4 = new Unit({
  // 			  files: files,
  // 			  model_count: models,
  // 			  base: base_25mm,
  // 			  x: 500,
  // 			  y: 300,
  // 			  fill_color: 'purple'
  // 			}, paper);
  // test_unit4.wheel(wheel, Constants.LEFT);
  // test_unit4.move(5, true);

  // test_unit4.troop_set.attr('fill', 'pink');
  // test_unit4.wheel(1, Constants.LEFT);

  // test_unit4.troop_set.attr('fill', 'transparent');
  // test_unit4.wheel(1, Constants.RIGHT);
  // test_unit4.troop_set.attr('fill', 'blue');

}