var express = require('express');
var router = express.Router();

var session = require('express-session');
router.use(session({
    secret: 'some secret passphrase',
    resave: false,
    saveUninitialized: true,
    cookie: {secure:false}
}));
function getContext(req) {
    if(!req.session.context) {
        req.session.context = Math.random().toString(16).substring(2);
        console.log('new context:'+req.session.context);
    }
    return req.session.context;
}

var bodyParser = require('body-parser');
router.use(bodyParser.json());

// var sqlite3 = require('sqlite3').verbose();
// var db = new sqlite3.Database(':memory:');
// db.serialize(function(){
//     db.run("CREATE TABLE IF NOT EXISTS peer(id TEXT NOT NULL PRIMARY KEY, description TEXT)");
//     db.run("CREATE TABLE IF NOT EXISTS candidate(id TEXT NOT NULL PRIMARY KEY, description TEXT, peerid TEXT)");
// });

router.get('/context', function(req,res,next){
    res.json({context:getContext(req)});
});
router.post('/context/:context', function(req,res,next){
    req.session.context = req.params.context;
    res.json({context:getContext(req)});
});
router.get('/dashboard/:context', function(req,res,next){
    req.session.context = req.params.context;
    res.redirect('/');
});
var offer={};
router.post('/offer', function(req, res, next) {
    console.log(req.body);
    offer[getContext(req)] = req.body;
    console.log("offer received:"+offer);
    res.status(200).end();
});
router.get('/offer', function(req,res,next){
    if (offer[getContext(req)]) {
        res.json(offer[getContext(req)]);
    } else {
        console.log("there is no offer yet");
        res.status(404).end();
    }
});
var theoffer={};
router.get('/offer/stream', function(req,res,next){
    req.socket.setTimeout(Number.MAX_VALUE);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
    var func = function(data){
        //res.write('data: {\n');
        //res.write('data: \"id\":'+new Date().getTime()+',\n');
        //res.write('data: \"msg\":\"'+JSON.stringify(data)+'\"\n');
        res.write('data: '+JSON.stringify(data)+'\n\n');
    };
    theoffer[getContext(req)]=func;
    req.on('close',function(){
        theoffer[getContext(req)] = null;
        offer[getContext(req)] = null;
    });
});
router.post('/awnser', function(req, res, next) {
    if (theoffer[getContext(req)]) {
        theoffer[getContext(req)](req.body);
        //offer[getContext(req)] = null;
        //theoffer[getContext(req)] = null;
        res.status(200).end();
    } else {
        res.status(404).end();
    }
});
var candidates={};
router.post('/candidate', function(req, res, next) {
    if(!candidates[getContext(req)]) candidates[getContext(req)]=[];
    var l = candidates[getContext(req)].length;
    for(var i=0;i<l;i++) {
        candidates[getContext(req)][i](req.body);
    }
    res.status(200).end();
});
router.get('/candidate/stream', function(req,res, next){
    req.socket.setTimeout(Number.MAX_VALUE);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
    var func = function(data){
        //res.write('data: {\n');
        //res.write('data: \"id\":'+new Date().getTime()+',\n');
        //res.write('data: \"msg\":\"'+JSON.stringify(data)+'\"\n');
        res.write('data: '+JSON.stringify(data)+'\n\n');
    };
    candidates[getContext(req)].push(func);
    req.on('close',function(){
        var l = candidates[getContext(req)].length;
        for(var i=0;i<l;i++) {
            if(candidates[getContext(req)][i]==func) {
                candidates[getContext(req)].splice(i,1);
                break;
            }
        }
    });
});

module.exports = router;
