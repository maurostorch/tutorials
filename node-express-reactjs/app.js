var express = require('express');
var app = express();

var session = require('express-session');
app.use(session({
    secret: 'some secret passphrase',
    resave: false,
    saveUninitialized: true,
    cookie: {secure:false}
}));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('todo.db');
db.serialize(function(){
    db.run("CREATE TABLE IF NOT EXISTS TODO(id INT NOT NULL PRIMARY KEY, description TEXT, done INT DEFAULT 0, username TEXT)");
});

app.use(function(req,res,next){
    if(req.session.logged || req.path.indexOf('/login')==0) {
        next();
    } else {
        req.session.lastPath = req.originalUrl;
        res.redirect('/login.html');
    }
});

app.use(express.static('html'));
app.use('/',express.static(__dirname + '/index.html'));
app.get('/todo', function(req,res){
    var l = [];
    db.each("select * from TODO where username=?",req.session.username, function(err, row){
        l[l.length]=row;
    }, function(err, affectedRows) {
        res.json(l);
    });
});
app.locals.listeners={};
function updateStream(req,data) {
    for(i=0;i<app.locals.listeners[req.session.username].length;i++) {
        app.locals.listeners[req.session.username][i](data);
    }
}
app.get('/todo/stream', function(req,res){
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
    app.locals.listeners[req.session.username][app.locals.listeners[req.session.username].length]=func;
    req.on('close',function(){
        var pos=-1;
        for(i=0;i<app.locals.listeners[req.session.username].length;i++){
            if(app.locals.listeners[req.session.username][i]==func){
                pos=i;
                break;
            }
        }
        if(pos >=0){
            console.log('removing '+pos);
            app.locals.listeners[req.session.username].splice(pos,1);
            console.log(app.locals.listeners[req.session.username]);
        }
    });
});
app.post('/todo',function(req,res) {
    if (req.body.description) {
        db.run('insert into todo(id,description,username) values((select coalesce(max(id+1),1) from todo),?,?)',[req.body.description,req.session.username], function(err){
            if (err){
                console.log(err);
                res.status(409).end();
            } else {
                var obj = req.body;
                obj.done=0;
                obj.id=this.lastID;
                updateStream(req,{op:'new',obj});
                res.json(obj);
            }
        });
    } else {
        console.log('missing values');
        res.status(405).end();
    }
});
app.get('/todo/:id', function(req,res){
    var r;
    db.each('select * from todo where id=?',req.params.id,function(err, row){
        r=row;
    }, function(err, affectedRows){
        if(err) {
            res.status(500).end();
        }else if(affectedRows==0){
            res.status(404).end();
        } else {
            res.json(r);
        }
    });
});
app.put('/todo/:id', function(req,res){
    if(req.body.description!=null && req.body.done!=null)
    db.run('update todo set description=?, done=? where id=?',
        [req.body.description,req.body.done,req.params.id],
        function(err) {
            if(err){
                console.log(err);
                res.status(404).end();
            } else {
                var obj = req.body;
                obj.id = req.params.id;
                updateStream(req,{op:'update',obj});
                res.json(obj);
            }
        }
    );
});
app.delete('/todo/:id', function(req,res){
    db.run('delete from todo where id=?',
        req.params.id,
        function(err) {
            if(err){
                console.log(err);
                res.status(404).end();
            } else {
                updateStream(req,{op:'delete',obj:{id:req.params.id}});
                res.status(200).end();
            }
        });
});

app.post('/login',function(req,res) {
    var username = req.body.username;
    var pass = req.body.password;
    if(pass=='admin') {
        req.session.logged=true;
        req.session.username=username;
        if(!app.locals.listeners[username])
            app.locals.listeners[username]=[];
    }
    if(req.session.lastPath=='/logout')
        req.session.lastPath='/';
    res.redirect(req.session.lastPath);
});
app.get('/logout', function(req,res){
    req.session.destroy(function(err){res.redirect("/");});
});

app.listen(3000, function() {
    console.log("App listen on 3000...");
});
