"use strict";

const EXPORTED_SYMBOLS = ["shareCaApp"];

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu,
   manager : Cm
} = Components;

var shareCaApp = {
    'init' : function (aService, aSettings) {
        this._service = aService;
        this._settings = aSettings;
        
        this.logger.debug(">shareCaApp Init");

        this._utils = Cu.import("chrome://share-ca/content/modules/utils.js", {}).utils;

        this._loadModules();
        this._utils.logger = this.logger

        this._initFB();
    },

    'finalize' : function () {
        this._listeners = null;
    },

    'addListener' : function (aType, aListener) {
        this.logger.debug("\tapp.js addListener " + aType + " : isArray " + Array.isArray(this._listeners[aType]));
        if (Array.isArray(this._listeners[aType])) {
            this._listeners[aType].push(aListener);
        } else {
            this._listeners[aType] = [aListener];
        };
    },

    'notifyListeners' : function (aType, aEvent) {
        let listeners = this._listeners[aType];
        this.logger.debug("\tapp.js notifyListeners : " + aEvent.type + " : isArray " + Array.isArray(listeners));
        if (Array.isArray(listeners)) {
            listeners.forEach(function (aListener) {
                if (!aListener || typeof aListener.handleEvent !== "function")
                    return;
                aListener.handleEvent(aEvent);
            });
        };
    },

    'handleEvent' : function (aEvent) {
        this.logger.debug("\tapp.js handleEvent : " + aEvent.type);
        switch (aEvent.type) {
            default:
                this.notifyListeners(aEvent.type, aEvent);
                break;
        };
    },

    'shareImage' : function (aImage, aText, aCallback) {
        this._FB.shareImage(aImage, aText, aCallback);
    },

    get logger () {
        return this._service.logger;
    },

    get settings () {
        return this._settings;
    },

    "_loadModules" : function () {
        let prePath = this._settings.path.modules;
        let self = this;
        this._settings.Modules.forEach(function ([aFileName, aModuleName]) {
            let fullPath = "%path/%module".replace("%path", prePath).replace("%module", aFileName);
            self.logger.debug("\tapp.js load Module: " + aFileName + " " + aModuleName);
            Cu.import(fullPath, self._modules)[aModuleName].init(self);
        });
    },

    "_initFB" : function () {
        let settingsFB = this.settings.socials.FB; 
        this._FB = Cu.import(settingsFB.module, {}).fbService;
        this._FB.init(this, settingsFB);
    },

    get libs () {
        return this._libs;
    },

    get FB () {
        return this._FB;
    },

    get utils () {
        return this._utils;
    },

    _libs : {},
    _modules : {},
    _settings : null,
    _utils : null,
    _listeners : {},

    _FB : null
};
