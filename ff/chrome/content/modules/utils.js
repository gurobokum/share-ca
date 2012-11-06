const EXPORTED_SYMBOLS = ["utils"];

const {
   classes : Cc,
   interfaces : Ci,
   utils : Cu
} = Components;

const XMLHttpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
const kConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
kConverter.charset = "utf-8";
//const APP = Cc["@share-it.org/jiojiajiu/app;1"].createInstance(Ci.nsIShareItApp);

let utils = {
    'getImageDimension' : function (img) {
        let boundingClientRect = img.getBoundingClientRect();
        let width = boundingClientRect.width;
        let height = boundingClientRect.height;
        return [width, height];
    },

    'ajax' : function (settings) {
        return new Ajax(settings)
    },

    'extend' : function (obj, nodeep) {
        for (let key in obj) {
            this[key] = obj[key]; 
            if (!nodeep && typeof obj[key] === 'object') {
                this[key] = {};
                utils.extend.call(this[key], obj[key]);
            }; 
        };
    }
};

var Ajax = function (settings) {
    let _settings = {
        "type" : "POST",
        "url" : null,
        "async" : true,
        "multipart" : false,
        "done" : function () {},
        "error" : function () {}
    };

    utils.extend.call(_settings, settings);
    this.__init__(_settings);
    return this; 
};

Ajax.prototype = {
    "__init__" : function (settings) {
        this.settings = settings;
    },

    "__final__" : function () {},

    'send' : function (data) {
        let xmr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance(Ci.nsIXMLHttpRequest);

        let params = this._generateParamsStr(data);
        let url = this.settings.url;
        if ((this.settings.type !== "POST") && params) {
            url += "?" + params;
        };
        let self = this;

        xmr.open(this.settings.type, url, this.settings.async);
        xmr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    self.settings.done.call(self, this.responseText); 
                } else {
                    self.settings.error.call(self, this.status, this.responseText);
                };
            };
        });
        if (this.settings.type !== "POST") {
            params = null;
        };

        if (this.settings.multipart) {
            let boundary = "--------------" + new Date().getTime();
            xmr.setRequestHeader("Content-type", "multipart/form-data;boundary=" + boundary);
            let params = this._generateMultipartData(data, boundary);
            utils.logger.warn("Params:\r\n " + params);
            xmr.sendAsBinary(params);
        } else {;
            xmr.send(params); 
        };
    },

    settings : null,

    "_generateParamsStr" : function (data) {
        let params = [];
        for (key in data) {
            let value = data[key];
            if (typeof value === "object") {
                value = JSON.stringify(value);
            }; 
            params.push(key + "=" + value);
        }; 
        return params.join("&");
    },

    "_generateGETUrl" : function () {
        let url = this.settings.url + "&" + params.join("?");
        return url;
    },

    //TODO:
    "_generateMultipartData" : function (data, boundary) {
        let parts = [];
        let CRLF = "\r\n";
        for (key in data) {
            let part = "";
            part += "Content-Disposition: form-data; ";
            //TODO:
            if (key === "source") {
                part += "name=" + key + "; ";
                part += "filename='shareit-photo';" + CRLF + CRLF;
                part += data[key] + CRLF;
            } else if (key === "message") {
                part += "name=" + key + CRLF + CRLF;
                part += kConverter.ConvertFromUnicode(data[key]) + CRLF;
            };
            parts.push(part);
        };
        
        let boundaryRecord = "--" + boundary + CRLF;

        let strData = boundaryRecord + parts.join(boundaryRecord) + "--" + boundary + "--" + CRLF;
        return strData;
    }
    
};
