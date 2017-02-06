/* jshint esversion:6, undef: true, unused: true, sub:true */
/* global $, localStorage, ajaxOut */

function errorPopup(msg,cb){
  $('#modalErrorMessage').text(""+msg);
  $('#modalError').openModal({
    dismissible: true,
    complete: cb
  });
  $('#modalErrorBtn').focus();
}

let waitPopupRunning = false;
function waitPopup(){
  if(waitPopupRunning) return;
  waitPopupRunning = true;
  $('#modalWait').openModal({dismissible: false});
  return function(){
    waitPopupRunning = false;
    $('#modalWait').closeModal();
  };
}

$(function(){
  "use strict";

  function processData(data){
    let min = 15, max = 25;
    let minT, maxT;
    data = data.filter(d => !d.error);
    let graph = data.map(function(d){
      if(minT === undefined || minT > d.time) minT = d.time;
      if(maxT === undefined || maxT < d.time) maxT = d.time;
      if(min > d.temperature) min = d.temperature;
      if(max < d.temperature) max = d.temperature;
      return [d.time,d.temperature];
    });
    $.plot($("#graph"), [ graph ], {xaxis:{mode:"time",min:minT,max:maxT}, yaxis:{min,max}});
  }

  function loginPopup(){
    localStorage.serverKey = null;
    if(!$('#modalLogin').is(':visible'))
      $('#modalLogin').openModal({dismissible: false});
    $('#modalLoginKey').focus();
  }

  function getTemperature(opt){
    opt = opt || {};
    let key = opt.key = opt.key || localStorage.serverKey;
    opt.startTime = opt.startTime || (new Date()) - 1000*60*60*24*7;

    let ready = waitPopup();
    if(!ready) return;
    ajaxOut(key,opt,function(err,res){
      ready();
      if(err) return errorPopup(err, function(){ loginPopup(); });
      localStorage.serverKey = opt.key;
      processData(res);
      $('#modalLogin').closeModal();
    });
  }

  $('#modalLoginOk').click(function(){
    getTemperature({key:$("#modalLoginKey").val()});
  });

  $('.datepicker').pickadate({});
  $('#startTime').change(function(){
    let startTime = $('#startTime').pickadate('picker').get('select').obj.getTime();
    getTemperature({startTime});
  });

  $('#modalLoginKey').keypress(function(event){
    if(event.keyCode == 13){
      event.preventDefault();
      $('#modalLoginOk').click();
    }
  });

  getTemperature();
});
