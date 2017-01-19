/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let fs = require("fs");
let http = require("http");
let MongoClient = require('mongodb').MongoClient;

let request = function(hostname,port,path,data,cb){
  let postData = JSON.stringify(data);

  let options = {hostname, port, path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  let req = http.request(options, function(res){
    res.setEncoding('utf8');
    let data = "";
    res.on('data', function(chunk){ data += chunk; });
    res.on('end', function(){
      if(!cb) return;
      if(this.statusCode != 200) return cb(data);
      let tmpCb = cb;
      cb = null;
      return tmpCb(null, data && JSON.parse(data));
    });
  });
  req.on('error', function(e){
    if(!cb) return;
    let tmpCb = cb;
    cb = null;
    return tmpCb(e);
  });
  req.write(postData);
  req.end();
};

let getData = function(){
  if(process.argv.length < 6)
    return console.log("syntax: node tools.js getData <url:[port]> <key> <filename>");
  let url = process.argv[3].split(":");
  let port = url[1] || 80;
  url = url[0];
  let key = process.argv[4];
  let file = process.argv[5];
  request(url, port, "/out",{key:key},function(err, data){
    if(err) return console.log(err);
    fs.writeFile(file,JSON.stringify(data, null, 2),function(err){
      if(err) return console.log(err);
      console.log("file '"+file+"' written");
    });
  });
};

let pushData = function(){
  if(process.argv.length < 6)
    return console.log("syntax: node tools.js pushData <url:[port]> <key> <filename>");
  let url = process.argv[3].split(":");
  let port = url[1] || 80;
  url = url[0];
  let key = process.argv[4];
  let file = process.argv[5];
  fs.readFile(file,function(err, data){
    if(err) return console.log(err);
    data = JSON.parse(""+data);
    request(url, port, "/in", {key:key,data:data},function(err){
      if(err) return console.log(err);
      console.log("request sent");
    });
  });
};

let sendCSV = function(){
  if(process.argv.length < 6)
    return console.log("syntax: node tools.js sendCSV <url:[port]> <key> <filename>");
  let url = process.argv[3].split(":");
  let port = url[1] || 80;
  url = url[0];
  let key = process.argv[4];
  let file = process.argv[5];
  fs.readFile(file,function(err, data){
    if(err) return console.log(err);
    data = (""+data).split("\n").map(function(line){
      line = line.split(",");
      if(line.length <= 1) return;
      return {time:parseInt(line[0]),temperature:parseFloat(line[2])};
    }).filter(d => d);
    request(url, port, "/in", {key:key,data:data},function(err){
      if(err) return console.log(err);
      console.log("request sent");
    });
  });
};

let resetdb = function(){
  if(process.argv.length < 5)
    return console.log("syntax: node tools.js resetdb <mongodbUrl> <db>");
  let url = process.argv[3];
  let dbName = process.argv[4];
  MongoClient.connect("mongodb://"+url+"/"+dbName,function(err, db){
    if(err) return console.log(err);
    db.collection('sensor').remove(function(err){
      if(err) return console.log(err);
      console.log("database erased");
      db.close();
    });
  });
};

let incorrect =function(mode){
  console.log("incorrect mode: " + mode);
};

let mode = process.argv[2];
({getData,pushData,sendCSV,resetdb}[mode] || incorrect)(mode);
