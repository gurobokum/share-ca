;(function () {

const {
    classes : Cc,
    interfaces : Ci,
    utils : Cu
} = Components

const GLOBAL = this;

var shareCaBrowser = {
    'init': function () {
        this._app = Cc["@share-ca.com/core;1"].getService().wrappedJSObject.app;
        let self = this;
        window.addEventListener("DOMContentLoaded", function (aEvent) {
            let win = aEvent.target;
            self.app.logger.debug("DOMContentLoaded " + win + " : " + win.localName);

            win.addEventListener("mouseover", self._app, false);
            win.addEventListener("mouseout", self._app, false);
//            win.addEventListener("click", self._app, false);
        }, false);
    },

    get app () {
        return this._app;
    },

    _app : null
}

window.addEventListener("load", function () {
    shareCaBrowser.init();
}, false);

}) ();
