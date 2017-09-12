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
  res.redirect('/new/http://www.google.com'); //for testing purposes
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
      res.json(data);
    }
  });
});

function shorten(url, callback){
  console.log('hello');
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
              if (err) return callback(err);
              console.log('inserted ' + r )
              return callback(null, data);
              db.close();
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
  while(isUnique == false){
    coll.findOne({
      short_url: d.short_url
    }, (err, doc) => {
      if (err) return callback(err);
      if (doc == {}) isUnique = true;
      else d.short_url = getRandomInt(1, 5000);
    });
  }
  return callback(null, d);
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
