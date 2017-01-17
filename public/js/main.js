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
  }

  function loginPopup(){
    localStorage.key = null;
    $('#modalLogin').openModal({dismissible: false});
  }

  $('#modalLoginOk').click(function(){
    let key = $("#modalLoginKey").val();
    let ready = waitPopup();
    ajaxOut(key,function(err,res){
      ready();
      if(err) return errorPopup(err);
      localStorage.key = key;
      processData(res);
      $('#modalLogin').closeModal();
    });
  });

  if(localStorage.key){
    let ready = waitPopup();
    return ajaxOut(localStorage.key, function(err,res){
      ready();
      if(err){
          localStorage.key = null;
          return loginPopup();
      }
      processData(res);
    });
  }else loginPopup();
});
