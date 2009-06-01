var local = {
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
    Globals.mode = Constants.mode.SELECTED_UNIT;
  },
  move: function(direction){
    if (Globals.selected === undefined) {
      tmp('Nothing selected');
      return;
    }
    Globals.selected.move(document.getElementById('dist').value, direction);
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
    Global.mode = Constants.mode.NEW_UNIT;
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

function do_pivot(){
  Globals.selected.pivot();
}