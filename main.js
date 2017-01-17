/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
var fs = require("fs");
var exec = require("child_process").exec;
var assert = require("assert");
var delay = 60000;
var errorDelay = 100;
var deviceFolder = "28-041685d663ff";

var modprobe = function(cb){
  var cmd = 'sudo modprobe w1-gpio && sudo modprobe w1-therm';
  exec(cmd, cb);
};

function now(){ return (new Date())-0; }

var output = function(err, temp){
  if(err) console.log(now() + ",ERROR," + err);
  else console.log(now() + ",OK," + temp.toFixed(3));
};

function readAndWait(){
  fs.readFile("/sys/bus/w1/devices/"+deviceFolder+"/w1_slave",function(err,data){
    if(err){
      output("Cannot connect to the temperature sensor");
      return modprobe(function(){ setTimeout(readAndWait,errorDelay*=2); });
    }
    var lines = (""+data).split("\n");
    if(lines[0].slice(-3) != "YES"){
      output("Corrupted data");
      return setTimeout(readAndWait,errorDelay*=2);
    }
    var i = lines[1].indexOf("t=");
    if(i == -1){
      output("Corrupted data");
      return setTimeout(readAndWait,errorDelay*=2);
    }
    output(null, parseInt(lines[1].slice(i+2))/1000);
    errorDelay = 100;
    return setTimeout(readAndWait,delay);
  });
}

var test = process.argv[2];
if(test == "test-all-ok"){
  deviceFolder = "28-041685d663ff";
  fs = {readFile: function(name,cb){
    assert(name == "/sys/bus/w1/devices/28-041685d663ff/w1_slave");
    return cb(null, "61 01 4b 46 7f ff 0c 10 57 : crc=57 YES\n61 01 4b 46 7f ff 0c 10 57 t=22062");
  }};
  output = function(err,temp){
    console.log(err,temp);
    assert(temp == 22.062);
  };
  modprobe = function(){
    throw new Error("this should never be called");
  };
}else if(test == "test-some-error"){
  fs = {readFile: function(name,cb){
    if(Math.random() < 0.25) return cb("ouch");
    if(Math.random() < 0.25) return cb(null, "crap");
    return cb(null, "61 01 4b 46 7f ff 0c 10 57 : crc=57 YES\n61 01 4b 46 7f ff 0c 10 57 t=22062");
  }};
  output = function(err,temp){
    console.log(err,temp);
  };
  modprobe = function(cb){
    console.log("modprobe called");
    return cb();
  };
}else if(test == "test-cannot-connect"){
  fs = {readFile: function(name,cb){ return cb("ouch"); }};
  output = function(err,temp){
    assert(!temp);
    console.log(err);
  };
  modprobe = function(cb){
    console.log("modprobe called");
    return cb();
  };
}

readAndWait();
