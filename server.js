/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let express = require('express');
let bodyParser = require('body-parser');
let http = require('http');
let path = require('path');
let MongoClient = require('mongodb').MongoClient;

if(process.argv.length < 3) return console.log("syntax: node server.js <key> [<mongodbUrl>]");
let key = process.argv[2];
let url = process.argv[3] || "mongodb://localhost:27017/Sensor";

let sensor = null;
let app = express();
app.set('port', 8085);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', function(req, res){ res.status(404).send({ title: 'Page Not Found'}); });

app.post("/in", function(req, res){
  try{
    if(req.body["key"] != key)
      return res.status(400).send("invalid key");
    let data = req.body["data"];
    data.forEach(d => d.date = new Date(d.time));
    sensor.insertMany(data, {w:1}, function(err){
      if(err) return res.status(500).send("database issue");
      res.status(200).send();
    });
  }catch(err){
    console.error(err.stack?err.stack:err);
    res.status(500).send("server error");
  }
});

app.post("/out", function(req, res){
  try{
    if(req.body["key"] != key)
      return res.status(400).send("invalid key");
    let query = {};
    if(req.body["startTime"]){
      query.time = (query.time || {});
      query.time["$gte"] = req.body["startTime"];
    }
    if(req.body["endTime"]){
      query.time = (query.time || {});
      query.time["$lt"] = req.body["endTime"];
    }
    sensor.find(query).toArray(function(err,data){
      if(err) return res.status(500).send("database issue");
      data.forEach(function(d){
        delete d.date;
        delete d._id;
      });
      res.status(200).send(data);
    });
  }catch(err){
    console.log.error(err.stack?err.stack:err);
    res.status(500).send("server error");
  }
});

MongoClient.connect(url,function(err, db){
  if(err) throw new Error("Unable to connect to the db: '"+ err + "'");
  sensor = db.collection('sensor');
  sensor.ensureIndex("time",function(err){
    if(err) throw new Error("Unable to ensure the time index in the database: '"+ err + "'");
    http.createServer(app).listen(app.get('port'), function(){
      console.log('listening on port ' + app.get('port'));
    });
  });
});
