
var Default_Events = {
  onabort: function(){},
  onblur: function(){},
  onchange: function(){},
  onclick: function(){
    switch (Globals.mode){
    case Constants.mode.RULER:
      Ruler.toggle(false);
      set_mode(Constants.mode.DEFAULT);
      break;
    default:
      Ruler.toggle(true);
      set_mode(Constants.mode.RULER);
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
    switch (Globals.mode){
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
    switch (Globals.mode){
    default:
      Default_Events.onabort();
    }
  };
  element.onblur = function(){
    switch (Globals.mode){
    default:
      Default_Events.onblur();
    }
  };
  element.onchange = function(){
    switch (Globals.mode){
    default:
      Default_Events.onchange();
    }
  };
  element.onclick = function(){
    switch (Globals.mode){
    default:
      Default_Events.onclick();
    }
  };
  element.ondblclick = function(){
    switch (Globals.mode){
    default:
      Default_Events.ondblclick();
    }
  };
  element.onerror = function(){
    switch (Globals.mode){
    default:
      Default_Events.onerror();
    }
  };
  element.onfocus = function(){
    switch (Globals.mode){
    default:
      Default_Events.onfocus();
    }
  };
  element.onkeydown = function(){
    switch (Globals.mode){
    default:
      Default_Events.onkeydown();
    }
  };
  element.onkeypress = function(){
    switch (Globals.mode){
    default:
      Default_Events.onkeypress();
    }
  };
  element.onkeyup = function(){
    switch (Globals.mode){
    default:
      Default_Events.onkeyup();
    }
  };
  element.onload = function(){
    switch (Globals.mode){
    default:
      Default_Events.onload();
    }
  };
  element.onmousedown = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmousedown();
    }
  };
  element.onmousemove = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmousemove();
    }
  };
  element.onmouseout = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmouseout();
    }
  };
  element.onmouseover = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmouseover();
    }
  };
  element.onmouseup = function(){
    switch (Globals.mode){
    default:
      Default_Events.onmouseup();
    }
  };
  element.onreset = function(){
    switch (Globals.mode){
    default:
      Default_Events.onreset();
    }
  };
  element.onresize = function(){
    switch (Globals.mode){
    default:
      Default_Events.onresize();
    }
  };
  element.onselect = function(){
    switch (Globals.mode){
    default:
      Default_Events.onselect();
    }
  };
  element.onsubmit = function(){
    switch (Globals.mode){
    default:
      Default_Events.onsubmit();
    }
  };
  element.onunload = function(){
    switch (Globals.mode){
    default:
      Default_Events.onunload();
    }
  };
}
