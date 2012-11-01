module.exports = function (app, express) {

    app.configure("development", function () {
        app.use(express.logger("dev"));
    });

    app.configure(function () {
        app.use(express.cookieParser());
        app.use(express.bodyParser());
        app.use(express.static(__dirname + "/public"));
    });

    app.set("view engine", "jade");
    app.set("view options", {
        layout : false
    });

};
