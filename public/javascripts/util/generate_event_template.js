// IMPORTANT:
// When overriding one of these locally, the "default"
// case MUST call Default_Events.<event>()
var Default_Events = {
  onabort: function(){},
  onblur: function(){},
  onchange: function(){},
  onclick: function(){
    switch (Mode.peek()){
    case Constants.mode.RULER:
      Ruler.toggle(false);
      Mode.pop();
      break;
    case Constants.mode.CREATE_UNIT:
      Globals.queued_unit.x = Globals.mouse.x;
      Globals.queued_unit.y = Globals.mouse.y;
      var last_unit = new Unit(Globals.queued_unit);
      Globals.queued_unit = undefined;
      Globals.selected = last_unit;
      Mode.pop();
      break;
    case Constants.mode.UNIT_PIVOT:
      Globals.selected.pivot();
      break;
    default:
      Ruler.toggle(true);
      Mode.push(Constants.mode.RULER);
    }
  },
  ondblclick: function(){},
  onerror: function(){},
  onfocus: function(){},
  onkeydown: function(){},
  onkeypress: function(){},
  onkeyup: function(){},
  onload: function(){},
  onmousedown: function(){},
  onmousemove: function(){
    switch (Mode.peek()){
    case Constants.mode.RULER:
      Ruler.draw();
      break;
    }
  },
  onmouseout: function(){},
  onmouseover: function(){},
  onmouseup: function(){},
  onreset: function(){},
  onresize: function(){},
  onselect: function(){},
  onsubmit: function(){},
  onunload: function(){}
};

function generate_event_template(element){
  element.onabort = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onabort();
    }
  };
  element.onblur = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onblur();
    }
  };
  element.onchange = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onchange();
    }
  };
  element.onclick = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onclick();
    }
  };
  element.ondblclick = function(){
    switch (Mode.peek()){
    default:
      Default_Events.ondblclick();
    }
  };
  element.onerror = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onerror();
    }
  };
  element.onfocus = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onfocus();
    }
  };
  element.onkeydown = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onkeydown();
    }
  };
  element.onkeypress = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onkeypress();
    }
  };
  element.onkeyup = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onkeyup();
    }
  };
  element.onload = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onload();
    }
  };
  element.onmousedown = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onmousedown();
    }
  };
  element.onmousemove = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onmousemove();
    }
  };
  element.onmouseout = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onmouseout();
    }
  };
  element.onmouseover = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onmouseover();
    }
  };
  element.onmouseup = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onmouseup();
    }
  };
  element.onreset = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onreset();
    }
  };
  element.onresize = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onresize();
    }
  };
  element.onselect = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onselect();
    }
  };
  element.onsubmit = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onsubmit();
    }
  };
  element.onunload = function(){
    switch (Mode.peek()){
    default:
      Default_Events.onunload();
    }
  };
}
