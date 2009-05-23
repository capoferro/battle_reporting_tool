/**
 * @param obj - Object to be inspected
 */
function inspect(obj){
  var str = '';
  for (i in obj){
    str += i + ': ' + obj[i] + "\n";
  }
  tmp(str);
  
}

function tmp(str){
  var txt = document.createTextNode(str);
  var br = document.createElement('br');
  document.getElementById('tmp').appendChild(txt);
  document.getElementById('tmp').appendChild(br);
}
