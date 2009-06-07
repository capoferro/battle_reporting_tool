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
  js('/javascripts/util/generate_event_template.js');
  js('/javascripts/util/Ruler.js');
  js('/javascripts/util/Unit.js');
  js('/javascripts/util/Troop.js');
  js('/javascripts/util/Base.js');
  js('/javascripts/util/Field.js');
  js('/javascripts/scratch.js');
  js('/javascripts/util/init.js');