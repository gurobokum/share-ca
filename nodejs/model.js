var utils = require("./utils");

const FREQ_RANDOM_OPTIONS = 0.33;

const AVAILABLE_LANGS = ["en", "fr", "ru"];

module.exports = Model = function (req, res) {
    this._lang = null;

    var self = this;
    var queryLang = req.query.lang;
    if (queryLang && ~AVAILABLE_LANGS.indexOf(queryLang)) {
        this._lang = queryLang;
    } else if (req.cookies && req.cookies.lang && ~AVAILABLE_LANGS.indexOf(req.cookies.lang)) {
        this._lang = req.cookies.lang;
    } else if (req.acceptedLanguages) {
        var langs = req.acceptedLanguages;
        for (var i = 0, length = langs.length; i < length; i++) {
            var lang = langs[i].toLowerCase();
            var matches = /^\w+/.exec(lang);
            if (!matches)
                continue;
            lang = matches[0];

            if (~AVAILABLE_LANGS.indexOf(lang)) {
                self._lang = lang;
                break;
            };
        };
    };

    if (!this._lang)
        this._lang = AVAILABLE_LANGS[0];

    res.cookie("lang", this._lang);
};

Model.prototype = {
    get locale () {
        var locale = require("./views/locale/" + this._lang);

        var contentOptions = locale["$content_options"];
        var contentSingletonOptions = locale["$content_singleton_options"];
        var contentRandomOptions = locale["$content_random_options"];

        var list = [];
        list = list.concat(utils.shuffle(contentOptions));
        list.push(utils.shuffle(contentSingletonOptions)[0]);
        if (Math.random() < FREQ_RANDOM_OPTIONS) {
            list.push(utils.shuffle(contentRandomOptions)[0]);
        };

        locale.list = list;

        return locale;
    },

    get lang () {
        return this._lang;
    }
}
