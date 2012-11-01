"use strict";

const EXPORTED_SYMBOLS = ["fbService"];

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu
} = Components;

const kWindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
const kWindowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
const kFileReader = Cc["@mozilla.org/files/filereader;1"].createInstance(Ci.nsIDOMFileReader);

const NS_HTML = "http://www.w3.org/1999/xhtml";

const PREF_TOKEN = "token.FB";

var fbService = {

    'init' : function (aApp, aSettings) {
        this._app = aApp;

        this.APP_ID = aSettings.APP_ID;
        this.APP_SECRET = aSettings.APP_SECRET;
        this.APP_CHANNEL = aSettings.APP_CHANNEL;

        this._token = this._app.prefs.get(PREF_TOKEN);
    },

    'shareImage' : function (img, text, callback) {
        if (!this._token) {
            this._setToken(this.shareImage.bind(this, img, text, callback));
            return;
        };

        if (!this._wallAlbumId) {
            this._setWallAlbumId(this.shareImage.bind(this, img, text, callback));
            return;
        };

        if (!this._profileName) {
            this._setProfileName(this.shareImage.bind(this, img, text, callback));
            return;
        };

        let doc = img.ownerDocument;
        let canvas = doc.createElement("canvas"); 
        let realImg = doc.createElement("img");
        realImg.src = img.src;
        realImg.onload = (function () {

        this._app.logger.debug(img.width + " : " + realImg.width);
        [canvas.width, canvas.height] = [realImg.width, realImg.height];
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0)
        let file = canvas.mozGetAsFile(canvas);

        this._app.logger.debug("shareImage " + img.src + " : " + file.size);

        let self = this;
        kFileReader.addEventListener("load", function onLoad() {
            kFileReader.removeEventListener("load", onLoad);
            if (this.readyState === this.DONE) {
                let postUrl = "https://graph.facebook.com/" + self._wallAlbumId + "/photos?access_token=" + self._token;
                let message = self._getPostMessage(doc.location.href);

                let ajax = self._app.utils.ajax({
                    "multipart" : true,
                    "url" : postUrl,
                    "done" : function (response) {
                        self._app.logger.debug("response " + response)
                        if (typeof callback === "function")
                            callback();
                    },
                    "error" : function (status, response) {
                        self._app.logger.debug("error " + status);
                        if (typeof callback === "function")
                            callback();
                    }
                }).send({
                    "message" : message, 
                    "source" : this.result,
                    "icon" : self._app.settings.src
                });
            };
        }, false);

        kFileReader.readAsBinaryString(file);

        }).bind(this);
    },

    "_setToken" : function (callback) {
        let authUrl = "https://www.facebook.com/dialog/oauth?client_id=" + this.APP_ID + 
            "&redirect_uri=" + this.APP_CHANNEL + 
            "&scope=user_photos,publish_stream,status_update,friends_status&response_type=token";
        this._app.logger.debug("_setToken " + authUrl);

        let gBrowser =  kWindowMediator.getMostRecentWindow("navigator:browser").gBrowser;
        let tab = gBrowser.addTab(authUrl);
        gBrowser.selectedTab = tab; 
        
        let self = this;
        let authHostname = this._app.settings.socials.FB.APP_CHANNEL;
        tab.addEventListener("load", function listenerAuth(event) {
            let browser = gBrowser.getBrowserForTab(event.target);
            let location = browser.contentWindow.location;
            if (~location.href.indexOf(authHostname)) {
                if  (!location.hash) {
                    tab.removeEventListener("load", listenerAuth);
                    return;
                };
                let params = location.hash.substring(1).split("&");
                for (let i = 0,length = params.length; i < length; i++) {
                    [key, value] = params[i].split("=");
                    if (key === "access_token") {
                        self._app.prefs.set(PREF_TOKEN, value);
                        self._token = value;
                        break;
                    };
                };
                tab.removeEventListener("load", listenerAuth);
                self._app.logger.debug("removeEventListener");
                if (self._token)
                    typeof callback === "function" ? callback() : 0;
            };
        });
    },

    "_setWallAlbumId" : function (callback) {
        let self = this;
        let requestUrl = "https://graph.facebook.com/fql?q=" + 
            "SELECT+object_id+FROM+album+WHERE+owner=me()+and+name=\"Timeline Photos\"" + 
            "&access_token=" + this._token;

        this._app.logger.debug("_requestWallAlbumId " + requestUrl);
        this._app.utils.ajax({
            "type" : "GET",
            "url" : requestUrl,
            "done" : function (response) {
                /** 
                 * @return {String}
                 * {
                 * "data": [{
                 *    "object_id": 4160749384030
                 *  }]
                 * }
                 */
                 self._app.logger.debug("response " + response);
                 self._wallAlbumId = JSON.parse(response)["data"][0]["object_id"];
                 if (typeof callback === "function")
                    callback();
            },
            "error" : function (status, response) {
                self._onError(status, response, callback);
            }
        }).send();
    },

    "_setProfileName" : function (callback) {
        let self = this;
        let requestUrl = "https://graph.facebook.com/me?fields=name"+
            "&access_token=" + this._token;
        this._app.logger.debug("_requestProfileName " + requestUrl);
        this._app.utils.ajax({
            "type" : "GET",
            "url" : requestUrl,
            "done" : function (response) {
                self._profileName = JSON.parse(response).name;
                if (typeof callback === "function")
                    callback();
            },
            "error" : function (status, response) {
                self._onError(status, response, callback);
            }
        }).send();
    },

    "_getPostMessage" : function (url) {
        //TODO;
        return this._profileName + " posted image by Share-ca from\n" + url//\u00C7a";
    },

    _onError: function (status, response, callback) {
        let responseObj = JSON.parse(response);
        let error = responseObj.error; 
        this._app.logger.debug("status " + status + " response " + response);
        if (!error)
            return;
        switch (error.code) {
            case 190: //invalid Token
                this._setToken(callback);
                break;
            default:
                break;
        };
        if (typeof callback === "function")
            callback(status);
    },

    APP_ID : null,
    APP_SECRET: null,
    APP_CHANNEL: null,

    _app : null,
    _token : null,
    _wallAlbumId : null,
    _profileName : null
};
