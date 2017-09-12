// server.js
// where your node app starts

// init project
var express = require('express');
var validUrl = require('valid-url');
var mongo = require('mongodb').MongoClient;
var dburl = 'mongodb://mahwang:' + process.env.DBPASSWORD + '@ds135364.mlab.com:35364/fcc-urlshortener';
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

app.get('/', (req, res) => {
  res.redirect('/new/hello'); //for testing purposes
  //res.send("If you would like to request a new shortened URL, use https://leaf-square.glitch.me/new/urlToShorten");
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/new/*", (req, res) => {
  var url = req.path.split('/new/')[1];
  
  shorten(url, (err, data) => {
    if (err) {
      res.json({
        'error': err
      });
    }
    else {
      data.short_url = 'https://' + req.hostname + '/' + data.short_url;
      res.json({
        'original_url': data.original_url,
        'short_url': data.short_url
      });
    }
  });
});

app.get('/*', (req, res) => {
  var path = +req.path.split('/')[1];
  if (isNaN(path)){
    res.json({
      'error': 'Invalid shortened URL - must be a number between 1 and 5000.'
    });
  }
  else{
    findOriginal(path, (err, data) => {
      if (err) {
        res.json({
          'error': err
        });
      }
      else {
        res.redirect(data);
      }
    })
  }
});

function findOriginal(url, callback){
  mongo.connect(dburl, (err, db) => {
    if (err) return callback(err);
    var coll = db.collection('urls');
    
    coll.findOne({
      short_url: url
    }, (err, doc) => {
      if (err) return callback(err);
      if (doc == null){
        return callback('No website found with this short URL.');
      }
      else{
        return callback(null, doc.original_url);
      }
    });
  });
}

function shorten(url, callback){
  if (validUrl.isHttpUri(url) || validUrl.isHttpsUri(url)){
    var data = {
      'original_url': url
    }
    console.log(data);
    mongo.connect(dburl, (err, db) => {
      if (err) return callback(err);
      var coll = db.collection('urls');
      
      coll.findOne({
        original_url: url
      }, (err, doc) => {
        console.log('doc is ' + doc);
        console.log('data is ' + data);
        if (err) return callback(err);
        if (doc != null) {
          data.short_url = doc.short_url;
          return callback(null, data);
        }
        else {
          createShortUrl(data, coll, (err, data) => {
            coll.insertOne(data, (err, r) => {
              if (err) {
                return callback(err);
              }
              else{
                console.log('inserted ' + r )
                return callback(null, data);
                db.close();
              }
            });
          });
        }
      });
    });
  }
  else return callback('Not a valid URL. Use the format http://www.website.com');
  
}

function createShortUrl(d, coll, callback){ 
  d.short_url = getRandomInt(1, 5000);
  var isUnique = false;
  var count = 0;
  console.log('isUnique starts as false');
  console.log('value of short_url is ' + d.short_url);
  findShortUrl(d.short_url, coll, (err, data) => {
    if (err) return callback(err);
    d.short_url = data;
    return callback(null, d);
  });
}

function findShortUrl(url, coll, callback){
  coll.findOne({
    short_url: url
  }, (err, doc) => {
    console.log('doc is ' + doc);
    if (err) {
      throw err;
    }
    if (doc == null) {
      return callback(null, url);
    }
    else {
      findShortUrl(getRandomInt(1, 5000), coll);
    }
  });
}
                  

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
