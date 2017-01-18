/* jshint esversion:6 */

function errorPopup(msg){
  $('#modalErrorMessage').text(""+msg);
  $('#modalError').openModal({dismissible: true});
}

function waitPopup(){
  $('#modalWait').openModal({dismissible: false});
  return function(){ $('#modalWait').closeModal(); };
}

$(function(){
  "use strict";

  function processData(data){
    console.log(data);
    let min = 15;
    let max = 25;
    let minT, maxT;
    data = data.filter(d => !d.error);
    let graph = data.map(function(d){
      if(minT === undefined || minT > d.time) minT = d.time;
      if(maxT === undefined || maxT < d.time) maxT = d.time;
      return [d.time,d.temperature];
    });
    console.log({minT,maxT});
    $.plot($("#graph"), [ graph ], {xaxis:{mode:"time",min:minT,max:maxT}, yaxis:{min,max}});
  }

  function loginPopup(){
    localStorage.serverKey = null;
    $('#modalLogin').openModal({dismissible: false});
  }

  $('#modalLoginOk').click(function(){
    let key = $("#modalLoginKey").val();
    let ready = waitPopup();
    ajaxOut(key,function(err,res){
      ready();
      if(err) return errorPopup(err);
      localStorage.serverKey = key;
      processData(res);
      $('#modalLogin').closeModal();
    });
  });

  if(localStorage.serverKey){
    let ready = waitPopup();
    return ajaxOut(localStorage.serverKey, function(err,res){
      ready();
      if(err){
          localStorage.serverKey = null;
          return loginPopup();
      }
      processData(res);
    });
  }else loginPopup();
});
