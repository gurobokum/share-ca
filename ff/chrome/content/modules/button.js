"use strict";

const EXPORTED_SYMBOLS = ["shareCaButton"];

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu,
   manager : Cm
} = Components;


const MIN_IMG_WIDTH = 100;
const MIN_IMG_HEIGHT = 100;

const kWindowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
const kBundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);

const NS_HTML = "http://www.w3.org/1999/xhtml";

const BUTTON_ID = "@share-ca.com/button;1";
const BUTTON_ATTRIBUTE = "share-ca-button";
const LOADING_STATUS = "@share-ca.com/loading";
const FORM_ID = "@share-ca.com/form;1";

const FORM_BUNDLE = kBundleService.createBundle("chrome://share-ca/locale/form.properties");

const shareCaButton = {
    'init' : function (aApp) {
        this._app = aApp;
        
        this._app.logger.debug(">shareCaButton Init");
        this._bindEvents();
        shareCaForm.init(aApp);
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
                        self.checkLoadingStatus(image);
                    });
                    image[LOADING_STATUS] = true;
                    this.checkLoadingStatus(image);
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

                shareCaForm.show(image);
                break;    
            };
            default:
                break;
        };
    },

    'checkLoadingStatus' : function (aElement) {
        if (!aElement)
            return;
        let doc = aElement.ownerDocument;
        let button = doc[BUTTON_ID];
        if (!button)
            return;
        if (button["image"] !== aElement) {
            this.checkLoadingStatus(button["image"]);
            return;
        };
        if (aElement[LOADING_STATUS])
            this._setLoadingStatus(button);
        else 
            this._unsetLoadingStatus(button);
    },

    "_show" : function (aElement) {
        let doc = aElement.ownerDocument;
        let button = doc[BUTTON_ID];
        if (!button) {
            button = this._create(doc);
        };
        let self = this;
        doc.defaultView.setTimeout(function () {
            self._position(button, aElement);
            self.checkLoadingStatus(aElement);
            button.style.setProperty("display", "block", "important");
        }, 0);
    },

    "_hide" : function (aDoc) {
        let button = aDoc[BUTTON_ID];
        if (!button) {
            return;
        };
        button.style.setProperty("display", "none", "");
    },

    "_position" : function (aButton, aElement) {
        let elementClientRect = aElement.getBoundingClientRect();
        let doc = aElement.ownerDocument;

        this._app.logger.debug("aButton " + aButton.width + " : " + aButton.height);
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

    "_setLoadingStatus" : function (aButton) {
        aButton.style.setProperty("opacity", "0.4", "important");
    },

    "_unsetLoadingStatus" : function (aButton) {
        aButton.style.setProperty("opacity", "1", "important");
    },

    "_bindEvents" : function () {
        this._app.addListener("mouseover", this); 
        this._app.addListener("mouseout", this); 
    },

    get app () {
        return this._app;
    },

    _app : null
};

const shareCaForm = {
    'init' : function (aApp) {
        this._app = aApp;
        
        this._app.logger.debug(">shareCaForm Init");
    },

    'show' : function (aElement) {
        let doc = aElement.ownerDocument;
        let form = doc[FORM_ID];

        if (!form) {
            let self = this;
            form = this._create(doc);
        };
        form.style.setProperty("display", "block", "important");
        this._position(form, aElement);
    },

    "_hide" : function (aDoc) {
        let form = aDoc[FORM_ID];
        if (!form)
            return;
        form.style.setProperty("display", "none", "");
    },

    "_submit" : function (aDoc) {
        let form = aDoc[FORM_ID];
        let image = form["image"];
        let textarea = form.querySelector("textarea");
        let text = textarea.value;
        textarea.value = "";

        this._app.logger.debug("form " + form + " : " + image + " : " + text);
        this._app.shareImage(image, text, function () {
            image[LOADING_STATUS] = null;
            shareCaButton.checkLoadingStatus(image);
        });
        image[LOADING_STATUS] = true;
        shareCaButton.checkLoadingStatus(image);

        this._hide(aDoc);
    },

    "_create" : function (aDoc) {
        var form = aDoc.createElement("form");
        form.style.setProperty("position", "absolute", "important");
        form.style.setProperty("z-index", "99999", "important");
        form.style.setProperty("padding", "7px", "important");
        form.style.setProperty("box-shadow", "1px 1px 1px #000", "important");
        form.style.setProperty("background",  "url(" + this._app.settings.bg + ")", "important");

        var text = aDoc.createElement("textarea");
        text.setAttribute("placeholder", FORM_BUNDLE.GetStringFromName("description"));
        text.style.setProperty("width", "250px", "important");
        text.style.setProperty("height", "100px","important");
        text.style.setProperty("display", "block", "important");
        text.style.setProperty("margin", "0px 0px 7px 0px", "important");
        text.style.setProperty("font-size", "14px", "important");
        text.style.setProperty("font-family", "Arial, sans-serif", "important");

        var submit = aDoc.createElement("input");
        submit.setAttribute("type", "button");
        submit.setAttribute("value", FORM_BUNDLE.GetStringFromName("send"));

        var cancel = aDoc.createElement("input");
        cancel.setAttribute("type", "button");
        cancel.setAttribute("value", FORM_BUNDLE.GetStringFromName("cancel"));

        form.appendChild(text);
        form.appendChild(cancel);
        form.appendChild(submit);
        aDoc.body.appendChild(form);
        aDoc[FORM_ID] = form;
        submit.addEventListener("click", this._submit.bind(this, aDoc), false);
        cancel.addEventListener("click", this._hide.bind(this, aDoc), false);

        return form;
    },

    "_position" : function (aForm, aElement) {
        let doc = aElement.ownerDocument;
        let buttonClientRect = doc[BUTTON_ID].getBoundingClientRect();
        let formClientRect = aForm.getBoundingClientRect(); 
        let docElementClientRect = doc.documentElement.getBoundingClientRect();
        
        let buttonLeft = buttonClientRect.left + doc.documentElement.scrollLeft;
        let buttonTop = buttonClientRect.top + doc.documentElement.scrollTop;
        let left = buttonLeft - (formClientRect.width / 2);
        let top = buttonTop - formClientRect.height;

        if (left > docElementClientRect.width)
            left = docElementClientRect.width;

        if (left > docElementClientRect.height)
            left = docElementClientRect.height;

        if (left < 0)
            left = 0;
        if (top < 0)
            top = 0;

        aForm.style.setProperty("left", left+"px", "important");
        aForm.style.setProperty("top", top+"px", "important");

        this._app.logger.debug("\tbutton.js: elemButton left [" + buttonLeft + "] top [" + buttonTop + "]");
        this._app.logger.debug("\tbutton.js: elemForm width [" + formClientRect.width + "] height [" + formClientRect.height + "]");
        this._app.logger.debug("\tbutton.js: elementForm left [" + left + "] top [" + top + "]");

        aForm["image"] = aElement;
    },

    _app : null
}
