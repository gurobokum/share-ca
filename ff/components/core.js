"use strict";

const {
    classes : Cc,
    interfaces : Ci,
    utils : Cu,
    manager : Cm 
} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const CONTRACT_ID = "@share-ca.com/app;1";
const CLASS_ID = "{b44362bb-09cd-48fe-a4a6-1e507094f522}";
/*
{ 0xb44362bb, 0x09cd, 0x48fe, \
  { 0xa4, 0xa6, 0x1e, 0x50, 0x70, 0x94, 0xf5, 0x22 } }
  */
const COOKIE = "share-ca.cookie";
const VERSION = 1.0;

const SETTINGS = Cu.import("chrome://share-ca/content/settings.json", {}).SETTINGS; 

function shareCaCore () {
    this._loadLibs();
    this._enableLogging();

    this._logger.debug("Init");
    this._initApp();
};

shareCaCore.prototype = {

    'observe' : function (aSubject, aTopic, aData) {
        this.logger.debug("shareCaService - " + aSubject);
        switch (aTopic) {
            case "profile-after-change":
                this.logger.debug("shareCaCore profile-after-change");
                break;
            default:
                break;
        };
    },

    get wrappedJSObject () {
        return this;
    },

    get libs () {
        return this._libs;
    },

    get app () {
        return this._app;
    },

    get logger () {
        return this._logger;
    },

    "_loadLibs" : function () {
        let prePath = SETTINGS.path.libs;
        let self = this;
        SETTINGS.Libs.forEach(function (aFileName) {
            let fullpath = "%path/%lib".replace("%path", prePath).replace("%lib", aFileName);
            Cu.import(fullpath, self._libs);
        });
    },

    "_enableLogging" : function () {
        let Log4Moz = this.libs.Log4Moz;

        let formatter = new Log4Moz.BasicFormatter();

        let root = Log4Moz.repository.rootLogger;
        root.level = Log4Moz.Level["All"];

        this._logger = Log4Moz.repository.getLogger(SETTINGS.name);
        this._logger.level = SETTINGS.LOG_LEVEL;

        let consoleAppender = new Log4Moz.ConsoleAppender(formatter);
        this._logger.addAppender(consoleAppender);
    },

    "_initApp" : function () {
        this._app = Cu.import("chrome://share-ca/content/app.js", {}).shareCaApp;
        this._app.init(this, SETTINGS);
    },

    _libs : {},
    _logger : null,
    _app : null,
    
    'classDescription' : "Share things easy way",
    'classID' : Components.ID(CLASS_ID),
    'contractID' : CONTRACT_ID,
    'QueryInterface' : XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIObserver])
};

/* register factory */
const NSGetFactory = XPCOMUtils.generateNSGetFactory([shareCaCore]);
