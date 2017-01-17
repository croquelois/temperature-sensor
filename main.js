/* jshint esversion:5, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
var fs = require("fs");
var exec = require("child_process").exec;
var http = require("http");
var assert = require("assert");
var delay = 60000;
var errorDelay = 100;
var deviceFolder = "28-041685d663ff";

function now(){ return (new Date())-0; }

var modprobe = function(cb){
  var cmd = 'sudo modprobe w1-gpio && sudo modprobe w1-therm';
  exec(cmd, cb);
};

var output = function(error, temperature){
  var time = now();
  if(error){
    console.log(time + ",ERROR," + error);
    agent.push({time:time,error:error});
  }else{
    console.log(time + ",OK," + temperature.toFixed(3));
    agent.push({time:time,temperature:temperature});
 }
};

var request = function(server,port,data,cb){
  var postData = JSON.stringify(data);

  var options = {
    hostname: server,
    port: port,
    path: '/in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  var req = http.request(options, function(res){
    res.setEncoding('utf8');
    var data = "";
    res.on('data', function(chunk){ data += chunk; });
    res.on('end', function(){
      if(!cb) return;
      if(this.statusCode != 200) return cb(data);
      var tmpCb = cb;
      cb = null;
      return tmpCb();
    });
  });
  req.on('error', function(e){
    if(!cb) return;
    var tmpCb = cb;
    cb = null;
    return tmpCb(e);
  });
  req.write(postData);
  req.end();
};

var agent = (function (){
  var queue = [];
  var buffer = [];
  var state = "idle";
  var delay = 5*60*1000;
  var errorDelay = 100;
  var server = null;
  var port = 80;
  var key = "";
  function send(cb){
    if(state != "idle") return cb("idle");
    state = "sending";
    queue.forEach(function(i){ buffer.push(i); });
    queue = [];
    request(server,port,{key:key,data:buffer},function(err){
      if(!err) buffer = [];
      else output(err);
      state = "idle";
      return cb(err);
    });
  }
  function loop(){
    send(function(err){
      if(err)
        return setTimeout(loop,errorDelay*=2);
      errorDelay = 100;
      return setTimeout(loop,delay);
    });
  }
  function push(data){
    if(!server) return;
    queue.push(data);
  }
  function run(){
    if(!server) return;
    setTimeout(loop,delay);
  }
  function init(server_,port_,key_){
    server = server_ || server;
    port = port_ || port;
    key = key_ || key;
  }
  function setDelay(d){
    delay = d;
  }
  return {push:push,run:run,init:init,setDelay:setDelay};
})();


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

var mode = process.argv[2];
if(mode == "test-all-ok"){
  delay = 1000;
  deviceFolder = "28-041685d663ff";
  fs = {readFile: function(name,cb){
    assert.equal(name, "/sys/bus/w1/devices/28-041685d663ff/w1_slave");
    return cb(null, "61 01 4b 46 7f ff 0c 10 57 : crc=57 YES\n61 01 4b 46 7f ff 0c 10 57 t=22062");
  }};
  output = function(err,temp){
    console.log(err,temp);
    assert.equal(temp, 22.062);
  };
  modprobe = function(){
    throw new Error("this should never be called");
  };
}else if(mode == "test-some-error"){
  delay = 1000;
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
}else if(mode == "test-cannot-connect"){
  delay = 1000;
  fs = {readFile: function(name,cb){ return cb("ouch"); }};
  output = function(err,temp){
    assert(!temp);
    console.log(err);
  };
  modprobe = function(cb){
    console.log("modprobe called");
    return cb();
  };
}else if(mode == "test-agent"){
  delay = 1000;
  agent.setDelay(2000);
  fs = {readFile: function(name,cb){
    assert.equal(name, "/sys/bus/w1/devices/28-041685d663ff/w1_slave");
    return cb(null, "61 01 4b 46 7f ff 0c 10 57 : crc=57 YES\n61 01 4b 46 7f ff 0c 10 57 t=22062");
  }};
  agent.init("test",42,"theKey");
  request = function(server,port,data,cb){
    console.log("server call", data);
    assert.equal(server, "test");
    assert.equal(port, 42);
    assert.equal(data.key, "theKey");
    assert(data.data.forEach);
    assert(data.data.length > 0);
    data.data.forEach(function(d){
      assert(!d.error);
      assert.equal(d.temperature, 22.062);
    });
    return cb();
  };
  modprobe = function(){
    throw new Error("this should never be called");
  };
}else if(mode == "test-agent-local"){
  delay = 1000;
  agent.setDelay(2000);
  fs = {readFile: function(name,cb){
    assert.equal(name, "/sys/bus/w1/devices/28-041685d663ff/w1_slave");
    return cb(null, "61 01 4b 46 7f ff 0c 10 57 : crc=57 YES\n61 01 4b 46 7f ff 0c 10 57 t=22062");
  }};
  var url = process.argv[3].split(":");
  var key = process.argv[4];
  agent.init(url[0],url[1],key);
}else if(mode == "agent"){
  var url = process.argv[3].split(":");
  var key = process.argv[4];
  agent.init(url[0],url[1],key);
}

readAndWait();
agent.run();
