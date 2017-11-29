// Developed by pH Labs for Factions Gaming
// CTRL + M + L to collapse!


// Dependencies
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const url = require('url');


// Startup
const app = express();
var pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "Burton69",
    database: "empyrion"
})
pool.getConnection(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Established connection to database!");
    }
});
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'super top secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));


// My Stuff
function getUserInfo(req) {
    if (typeof (req.session.user) == "undefined" || req.session.user == null) {
        return false;
    }
    return req.session.user;
}


// Routes
app.get('/', function (req, res) {
    res.render('pages/index', {
        user: getUserInfo(req)
    });
});
app.get('/login', function (req, res) {
    res.render('pages/login', {
        user: getUserInfo(req),
        message: ""
    });
});
app.post('/login', function (req, res) {
    var userEmail = req.body.userEmail;
    var userPass = req.body.userPass;
    var message = "";
    pool.query('select * from users where user_email = ?', [userEmail], function (err, result) {
        if (err) {
            console.log(err);
            message = "Could not connect to database. Please try again.";
        } else {
            if (result.length > 0) {
                if (result[0].user_pass == userPass) {
                    req.session.user = result[0];
                    res.redirect('/');
                    return;
                } else {
                    var message = "User name and password do not match...";
                }
            } else {
                message = "User not found, try creating a new account.";
            }
        }
        res.render('pages/login', {
            user: getUserInfo(req),
            message: message
        });
    });
});
app.get('/logout', function (req, res) {
    req.session.user = null;
    res.render('pages/login', {
        user: getUserInfo(req),
        message: "You have successsfully logged out."
    });
});
app.get('/forum', function (req, res) {
    pool.query('select * from categories', function (err, result) {
        if (err) {
            console.log(err);
        } else {
            res.render('pages/forum', {
                user: getUserInfo(req),
                result: result
            });
        }
    });
});
app.get('/forum/topic', function (req, res) {
    var accessLevel;
    if (!getUserInfo(req)) {
        accessLevel = 0;
    } else {
        accessLevel = getUserInfo(req).user_level;
    }
    var q = url.parse(req.url, true);
    var qdata = q.query;
    pool.query('select * from threads where cat_id = ? and access_level <= ?', [qdata.cid, accessLevel], function (err, result) {
        if (err) {
            console.log(err);
            res.redirect('/forum');
        } else {
            res.render('pages/topic', {
                user: getUserInfo(req),
                result: result
            });
        }
    });
});
app.post('/forum/topic', function (req, res) {
    var user = getUserInfo(req);
    var subject = req.body.subject;
    var body = req.body.body;
    var cid = url.parse(req.url, true).query.cid;
    pool.query('insert into threads (cat_id, user_id, thread_subject, thread_body) values (?, ?, ?, ?)', [cid, user.user_id, subject, body], function (err, result) {
        if (err) console.log(err);
    });
    res.redirect('back');
})

// Start
app.listen(8082, "127.0.0.1", function () {
    console.log("Server starting up. Listening on port 8082.");
});