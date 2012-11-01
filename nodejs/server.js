var express = require("express");
var Db = require("mongodb").Db;
var assert = require("assert");

var app = express();

require("./config")(app, express);

var LocalizationModel = require("./model");

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "localhost";

var MONGO_CONNECT_URL = "mongo://admin:11@localhost:27017/share-ca-db?safe=false";

//TODO: вынести определение констант
app.configure("production", function () {
    MONGO_CONNECT_URL = "mongodb://share-ca-admin:daind21Gjx@staff.mongohq.com:10022/app4554242?safe=false";
});

app.get("/", function (req, res) {
    var model = new LocalizationModel(req, res);
    res.locals(model.locale);

    res.render("pages/index");
});

app.get("/auth-fb", function (req, res) {
    var model = new LocalizationModel(req, res);
    res.locals(model.locale);

    res.render("pages/auth-fb");
});

app.get("/share-ca.xpi", function (req, res) {
    res.sendfile("./files/share-ca.xpi");

    Db.connect(MONGO_CONNECT_URL, function (error, db) {
        assert.equal(null, error);
        var collection = db.collection("downloads");

        collection.insert({
            date: new Date(),
            type: "firefox",
            ip: req.ip,
            userAgent: req.header("User-Agent"),
            referer: req.header("Referer")
        });
        db.close();
    });
});

app.get("/feedback.tmpl", function (req, res) {
    if (!req.xhr)
        res.redirect("/");
    var model = new LocalizationModel(req, res);
    res.locals(model.locale);

    res.render("partial/feedback.jade")
});

app.post("/message", function (req, res) {
    if (!req.xhr)
        return;
    Db.connect(MONGO_CONNECT_URL, function (error, db) {
        assert.equal(null, error);
        var collection = db.collection("messages");

        collection.insert({
            date: new Date(),
            mail: req.body.mail,
            message: req.body.message,
            userAgent: req.header("User-Agent")
        });
        db.close();
    });
    res.send(200);
});

app.listen(PORT);
