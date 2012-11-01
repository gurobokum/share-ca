"use strict";

const EXPORTED_SYMBOLS = ["shareCaPrefs"]

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu,
   manager : Cm
} = Components;

const kPrefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

const PREF_BRANCH = "extensions.share-ca."

var shareCaPrefs = {
    'init' : function (aApp) {
        this._app = aApp;
        this._app.prefs = this;
    },

    'set' : function (key, value) {
        switch (typeof value) {
            case "boolean":
                value = this.branch.setBoolPref(key, value);
                break;
            case "number":
                value = this.branch.setIntPref(key, value);
                break;
            case "string":
                value = this.branch.setCharPref(key, value);
                break;
            default:
                break;
        };
    },

    'get' : function (key, defaultValue) {
        let value;
        switch (this.branch.getPrefType(key)) {
            case Ci.nsIPrefBranch.PREF_BOOL:
                value = this.branch.getBoolPref(key);
                break;
            case Ci.nsIPrefBranch.PREF_INT:
                value = this.branch.getIntPref(key);
                break;
            case Ci.nsIPrefBranch.PREF_STRING:
                value = this.branch.getCharPref(key);
                break;
            default:
                break;
        };
        return value || defaultValue;
    },

    get branch () {
        return kPrefService.getBranch(PREF_BRANCH);
    },

    _app : null
};
