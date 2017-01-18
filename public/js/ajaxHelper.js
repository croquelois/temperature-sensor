/* jshint esversion:6 */
/* global $, console, setTimeout */

var reqPost = function(){
  var serverurl = "/";
  return function(url,data,cb){
    cb = cb || function(){};
    $.ajax(
      {
        type: "POST",
        url: serverurl+url,
        data: JSON.stringify(data),
        contentType: "application/json; charset=UTF-8",
        processData: false
      }
    ).done(function(ret){ cb(null,ret); })
     .fail(function(err){
       try{
         err = JSON.parse(err.responseText).msg;
       }catch(ex){
         err = err.responseText || "unknown error";
       }
       cb(err,null);
     });
	};
}();

// User
function ajaxOut(key,cb){
  reqPost("out",{key},cb);
}
