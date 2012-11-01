"use strict";

const EXPORTED_SYMBOLS = ["shareCaButton"]

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu,
   manager : Cm
} = Components;


const MIN_IMG_WIDTH = 100;
const MIN_IMG_HEIGHT = 100;

const kWindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

const NS_HTML = "http://www.w3.org/1999/xhtml";

const BUTTON_ID = "@share-ca.com/button;1";
const BUTTON_ATTRIBUTE = "share-ca-button";
const LOADING_STATUS = "@share-ca.com/loading";
const FORM_ID = "@share-ca.com/form;1";

let shareCaButton = {
    'init' : function (aApp) {
        this._app = aApp;
        
        this._app.logger.debug(">shareCaButton Init");
        this._bindEvents();
    },

    //TODO:
    'finalize' : function () {
    },

    'handleEvent' : function (aEvent) {
        let target;
        switch (aEvent.type) {
            case "mouseover":
                target = aEvent.originalTarget;
                if (target.hasAttribute(BUTTON_ATTRIBUTE)) {
                    return;
                };
                if (target.localName !== 'img') {
                    return;
                }; 
                let [width, height] = this._app.utils.getImageDimension(target);

                if (width < MIN_IMG_WIDTH || height < MIN_IMG_HEIGHT) {
                    return;
                };

                this._show(target);
                break;
            case "mouseout":
                target = aEvent.originalTarget;
                let related = aEvent.relatedTarget;
                if (related && related.hasAttribute(BUTTON_ATTRIBUTE)) {
                    return;
                };
                if (target.localName !== 'img') {
                   return; 
                };

                this._hide(target.ownerDocument);
                break;
            case "click":
                target = aEvent.originalTarget;
                if (!target.hasAttribute(BUTTON_ATTRIBUTE)) {
                    return;
                };
                let image = target["image"];
                if (image[LOADING_STATUS])
                    return;

                let self = this;
                if (aEvent.button === 0) {
                    this._app.shareImage(image, null, function () {
                        image[LOADING_STATUS] = null;
                        if (image === target["image"])
                            self._unsetLoadingStatus(target);
                    });
                    image[LOADING_STATUS] = true;
                    this._setLoadingStatus(target);
                };
                break;
            case "contextmenu": {
                target = aEvent.originalTarget;
                if (!target.hasAttribute(BUTTON_ATTRIBUTE)) {
                    return;
                };
                aEvent.preventDefault();
                let image = target["image"];
                if (image[LOADING_STATUS])
                    return;

                this._app.logger.debug("right click") 
                this._showForm(image);
                break;    
            }
            case "submit": {
                //TODO:
                target = aEvent.originalTarget;
                let image = target["image"];
                /*
                let text = target.querySelector("textarea").value;
                let self = this;

                this._app.shareImage(image, text, function () {
                    image[LOADING_STATUS] = null;
                    if (image === target["image"])
                        self._unsetLoadingStatus(target);
                });
                image[LOADING_STATUS] = true;
                this._setLoadingStatus(target);
                */
                break;
            }
            default:
                break;
        };
    },

    "_show" : function (aElement) {
        let doc = aElement.ownerDocument;
        let button = doc[BUTTON_ID];
        if (!button) {
            let self = this;
            button = this._create(doc);
        };
        this._position(button, aElement);
        if (aElement[LOADING_STATUS])
            this._setLoadingStatus(button);
        else 
            this._unsetLoadingStatus(button);
        button.style.setProperty("display", "block", "important");
    },

    "_hide" : function (aDoc) {
        let button = aDoc[BUTTON_ID];
        if (!button) {
            return;
        };
        button.style.setProperty("display", "none", "");
    },

    "_showForm" : function (aElement) {
        let doc = aElement.ownerDocument;
        let button = doc[BUTTON_ID];
        let form = doc[FORM_ID];

        if (!form) {
            let self = this;
            form = this._createForm(doc);
        };
        this._positionForm(form, aElement);
        form.style.setProperty("display", "block", "important");
    },

    "_hideForm" : function (aDoc) {
        let form = aDoc[FORM_ID];
        if (!form)
            return;
        form.style.setProperty("display", "none", "");
    },

    "_position" : function (aButton, aElement) {
        let elementClientRect = aElement.getBoundingClientRect();
        let doc = aElement.ownerDocument;

        let left = parseInt(doc.documentElement.scrollLeft, 10) +
                   elementClientRect.left +
                   elementClientRect.width - 
                   parseInt(aButton.width, 10);

        let top = parseInt(doc.documentElement.scrollTop, 10) +
                  elementClientRect.top +
                  elementClientRect.height -
                  parseInt(aButton.height, 10);

        aButton.style.setProperty("left", left + "px", "important");
        aButton.style.setProperty("top", top + "px", "important");

        this._app.logger.debug("'\tbutton.js: elementButton left [" + left + "] top [" + top + "]");

        aButton["image"] = aElement;
    },

    "_positionForm" : function (aForm, aElement) {
        let buttonClientRect = aElement.ownerDocument[BUTTON_ID].getBoundingClientRect();
        let formClientRect = aForm.getBoundingClientRect(); 
        
        let left = buttonClientRect.left - (formClientRect.width / 2);
        let top = buttonClientRect.top - formClientRect.height;
        if (left < 0)
            left = 0;
        if (top < 0)
            top = 0;

        aForm.style.setProperty("left", left+"px", "important");
        aForm.style.setProperty("top", top+"px", "important");

        this._app.logger.debug("\tbutton.js: elementForm left [" + left + "] top [" + top + "]");

        aForm["image"] = aElement;
    },

    "_create" : function (aDoc) {
        let img = new aDoc.defaultView.Image();
        img.src = this._app.settings.src;
        img.style.setProperty("position", "absolute", "important");
        img.style.setProperty("z-index", "99999", "important");
        img.setAttribute(BUTTON_ATTRIBUTE, "true");
        aDoc[BUTTON_ID] = img;
        aDoc.body.appendChild(img);
        img.addEventListener("click", this, false);
        img.addEventListener("contextmenu", this, false);

        return img;
    },

    "_createForm" : function (aDoc) {
        var form = aDoc.createElement("form");
        form.style.setProperty("position", "absolute", "important");
        form.style.setProperty("z-index", "99999", "important");

        var text = aDoc.createElement("textarea");
        text.setAttribute("placeholder", "Write description");

        var submit = aDoc.createElement("input");
        submit.setAttribute("type", "submit");
        submit.setAttribute("value", "Send");

        form.appendChild(text);
        form.appendChild(submit);
        aDoc.body.appendChild(form);
        aDoc[FORM_ID] = form;
        form.addEventListener("submit", this, false);

        return form;
    },

    "_setLoadingStatus" : function (aButton) {
        aButton.style.setProperty("opacity", "0.4", "important");
    },

    "_unsetLoadingStatus" : function (aButton) {
        aButton.style.setProperty("opacity", "1", "important");
    },

    get app () {
        return this._app;
    },
    
    "_bindEvents" : function () {
        this._app.addListener("mouseover", this); 
        this._app.addListener("mouseout", this); 
    },

    _app : null

};
