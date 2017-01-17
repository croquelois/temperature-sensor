/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');

var app = express();
app.set('port', 8085);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let data = []; // put that in a DB
data.push({time:1484614061369,temperature:19.562});
data.push({time:1484614061370,temperature:19.625});
data.push({time:1484614061371,temperature:19.562});
let key = "croq"; // put that somewhere else

app.post("/in", function(req, res){
  try{
    if(req.body["key"] != key)
      return res.status(400).send("invalid key");
    req.body["data"].forEach(d => data.push(d));
    res.status(200).send(data);
  }catch(err){
    console.log.error(err.stack?err.stack:err);
    res.status(500).send("server error");
  }
});
app.post("/out", function(req, res){
  try{
    if(req.body["key"] != key)
      return res.status(400).send("invalid key");
    res.status(200).send(data);
  }catch(err){
    console.log.error(err.stack?err.stack:err);
    res.status(500).send("server error");
  }
});
app.get('*', function(req, res){ res.status(404).send({ title: 'Page Not Found'}); });

http.createServer(app).listen(app.get('port'), function(){
  console.log('listening on port ' + app.get('port'));
});
