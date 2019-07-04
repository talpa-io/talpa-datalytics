/**
 * ComponentJS
 *
 * @author Matthias Leuffen <m@tth.es>
 */


class c {


    /**
     * HTTP Client for Ajax Requests
     *
     * @static
     * @param url
     * @return {CJ_Req}
     */
    static req (url) {
        return new CJ_Req(url);
    }





}

class ce {


    static _getElementById(id, type) {
        var elem = $("#" + id)[0];
        if (elem === null)
            throw "Element #" + id + " not found";
        if (type !== undefined)
            if ( ! elem instanceof type)
                throw "Element #" + id + " not of type " + type;
        return elem;
    }


    /**
     *
     * @static
     * @param id
     * @returns {CJFormElement}
     */
    static form(id) {
        return ce._getElementById(id, CJFormElement);
    }

    /**
     * @static
     * @param id
     * @return {CjHighlightElement}
     */
    static highlight(id) {
        return ce._getElementById(id, CjHighlightElement);
    }

    /**
     *
     * @static
     * @param id
     * @return {CJPaneElement}
     */
    static pane(id) {
        return ce._getElementById(id, CJPaneElement);
    }

    /**
     *
     * @param id
     * @return {HTMLElement}
     */
    static any(id) {
        return ce._getElementById(id);
    }
}


class CJ_Req {

    constructor(url) {
        this.request = {
            url: url,
            method: "GET",
            body: null,
            success: false,
            dataType: "text",
            data: null
        }
    }

    /**
     * Add
     * @param params
     * @return {CJ_Req}
     */
    withParams(params) {
        this.request.data = params;
        return this;
    }


    /**
     *
     * @param body
     * @return {CJ_Req}
     */
    withBody(body) {
        if (this.request.method === "GET")
            this.request.method = "POST";
        if (Array.isArray(body) || typeof body === "object")
            body = JSON.stringify(body);
        this.request.body = body;
        return this;
    }

    set json(fn) {
        this._make_request(fn, "json")
    }

    set plain(fn) {
        this._make_request(fn, null)
    }

    set stream(fn) {
        this._make_request(fn, "stream");
    }

    /**
     *
     * @param fn
     * @param filter
     * @private
     */
    _make_request(fn, filter) {
        this.request.success = function (data) {
            if (filter === "json")
                data = JSON.parse(data);
            fn(data);
        };
        $.ajax(this.request);
    }

}

class CJHtmlElement extends HTMLElement {

    constructor() {
        super();
        this.debug = false;
    }

    static get observedAttributes() { return ["debug"]; }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "debug":
                this.debug = true;
                break;

        }
    }


    /**
     * Log output (if debug is on)
     *
     * @protected
     * @param param1
     * @param param2
     */
    _log(param1, param2) {
        if (this.debug)
            console.log(this, ...arguments);
    }

}
class CompCore {
    constructor() {
        this.ajaxOptions = {
            dataType: "json",
            error: function (err) {
                alert ("Error executing form request.");
                throw "Error"
            }
        };
        this.ajaxOptionsHtml = {
            error: function (err) {
                alert ("Error executing form request.");
                throw "Error"
            }
        }

    }

    static get instance () {
        return new CompCore();
    }


    evalAttr(attrValue, event, ownerObj) {
        console.log("eval", attrValue);
        if (attrValue === null)
            return null;
        if (typeof attrValue === "string") {
            var context = function(e) {
                console.log(this);
                return eval(attrValue)
            };
            console.log("owner", ownerObj);
            var ret = context.bind(ownerObj)(event);
            if (typeof ret !== "function")
                return ret;
            return ret.bind(ownerObj)(event)
        }
        if (typeof attrValue === "function")
            return attrValue(event, ownerObj);

        console.error("eval error:", attrValue)
        throw "Cannot evaluate expression - see output"
    }
}





class CjExecElement extends CJHtmlElement {



    constructor() {
        super();
    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
                    var codeNode = self.previousElementSibling;
                    if (codeNode.tagName !== "PRE") {
                        self._log("Cannot find sibling <pre> node");
                    }

                    codeNode = codeNode.querySelector("code");


                    self._log("textContent=", codeNode.textContent);


                    self.innerHTML = codeNode.textContent;


                    setTimeout(function() {
                        $("script", self).each(function(idx, node) {
                            eval(node.textContent);
                        })
                    },1);


                }, 1);
    }


}

customElements.define("cj-exec", CjExecElement);


class CjHighlightElement extends CJHtmlElement {



    constructor() {
        super();
        this._value = "";
        this._codeElement = null;
        this.lang = "html"
    }

    static get observedAttributes() { return ["lang", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "lang":
                this.lang = newValue;
                break;

        }
    }

    /**
     * Set the text to highlight
     *
     * @public
     * @param {string} code     the code to hightlight
     * @param {string} codeType The highlighter to use (html|text|js)
     */
    setCode(code, codeType) {
        if (codeType === undefined)
            codeType = this.lang;

        this._value = code;
        if (this._codeElement !== null) {
            this._codeElement.innerText = code;
            this._codeElement.classList.add(codeType);
            document.dispatchEvent(new Event("load"));
        }
    }


    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
                    var content = self.innerHTML;
                    self._log("content to highlight", content);
                    var div = document.createElement("div");

                    self.appendChild(div);

                    var pre = document.createElement("pre");
                    div.appendChild(pre);

                    var code = document.createElement("code");
                    pre.appendChild(code);

                    self._codeElement = code;

                    code.classList.add(self.lang);
                    code.style.whiteSpace = "pre";

                    if (content.trim() !== "") {
                        code.innerText = content;
                        document.dispatchEvent(new Event("load"));
                    }


                }, 1);
    }


}

customElements.define("cj-highlight", CjHighlightElement);

class CJFormElement extends CJHtmlElement {
    constructor() {
        super();
        this._submittableElement = null;
        this._formElements = null;
        this.cf_onsubmit = null;
        self = this;
    }


    get data() {
        return this.getData();
    }

    set data(value) {
        this.setData(value);
    }


    static get observedAttributes() { return ["onsubmit", "onchange", "debounce", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "onsubmit":
                this.cf_onsubmit = newValue;
                break;



        }
    }


    /**
     * Private
     *
     * @param form
     * @param dataObj
     * @private
     */
    _gather_form_data (form, dataObj) {
        switch (form.tagName) {
            case "INPUT":
                switch (form.type) {
                    case "checkbox":
                    case "radio":
                        if (form.checked == true)
                            dataObj[form.name] = form.value;
                        return;
                }
            case "SELECT":
                dataObj[form.name] = $(form).val();
                break;
            case "TEXTAREA":
                dataObj[form.name] = $(form).val();
                break;
        }
    }

    /**
     * Read the currently values from the form and return
     * object based on the forms names
     *
     * @return object
     */
    getData() {
        var ret = {};
        var elements = $("input, textarea, checkbox, select", this);
        elements.each((i, e) => this._gather_form_data(e, ret));
        this._log("getData():", ret);
        return ret;
    }




    /**
     *
     * @param form
     * @param dataObj
     * @private
     */
    _fill_form_single(form, dataObj) {
        var formName = form.name;
        if (formName === undefined)
            formName = form.id;

        switch (form.tagName) {
            case "INPUT":
                switch (form.type) {
                    case "checkbox":
                    case "radio":
                        if (dataObj[formName] == form.value) {
                            form.checked = true;
                        } else {
                            form.checked = false;
                        }
                        return;
                }
                form.value = dataObj[formName];
                break;
            case "SELECT":
                form.value = dataObj[formName];
                break;
            case "TEXTAREA":
                form.value = dataObj[formName];
                break;
        }
    }

    /**
     * Set the form data from external and rerender the input values
     *
     * @public
     * @param data
     */
    setData(data) {
        this._log("setData()", data);
        var elements = $("input, textarea, checkbox, select", this);
        elements.each((i, e) => this._fill_form_single(e, data));
    }

    _submit(e) {
        this._log("_submit(", e, "); calling: onsubmit=", this.cf_onsubmit);
        CompCore.instance.evalAttr(this.cf_onsubmit, e, this);
    }


    connectedCallback() {
        var self = this;
        setTimeout(function() {
            // Register event handler
            self._submittableElement = self.querySelector("form");
            if (self._submittableElement === null) {
                self._submittableElement = self.querySelector("button[type='submit']");
                self._submittableElement.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self._submit(e);
                }
            } else {
                self._submittableElement.onsubmit = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    self._submit(e)
                }
            }

        }, 1);
    }

}


customElements.define("cj-form", CJFormElement);

class CJOptionsElement extends CJHtmlElement {
    constructor() {
        super();
        this._options = [];
        this._selectElementId = [];

    }



    static get observedAttributes() { return ["for", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "for":
                this._selectElementId = newValue;
                break;

        }
    }


    refresh() {
        this.innerHTML = "";
        this._options.forEach(i, elem => {
            this._log("add", i, elem);
            if (typeof elem === "object") {
                var val = elem.value;
                var text = elem.text;
            } else if (typeof elem === "string") {
                var val, text = elem;
            }

            var option = document.createElement("option");
            option.setAttribute("value", val);
            option.textContent = text;
            this.appendChild(option);
        })
    }

    connectedCallback() {
        this._log("cj-objection connected()");
        var self = this;
        setTimeout(function() {
            console.log("muh");
            if (self.textContent.trim() !== "") {

                self._options = JSON.parse(self.textContent);
                self._log("Loading options preset from json:", self._options)
            }
            self.textContent = "";
            self.refresh();
        }, 1);
    }
}


customElements.define("cj-options", CJOptionsElement);

class CJPaneElement extends CJHtmlElement {



    constructor() {
        super();
        this._src = null;
        this.targetNode = null;
        this._shadowDom = false;
    }

    static get observedAttributes() { return ["src", "shadow-dom", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "src":
                this._src = newValue;
                if (this._src != null)
                    this._loadUrl(this._src);
                break;
            case "shadow-dom":
                this._shadowDom = true;
                break;
        }
    }

    _loadUrl(url) {
        console.log("load", url);
        var self = this;
        setTimeout(function() {
            jQuery.ajax(url, CompCore.instance.ajaxOptionsHtml)
                .done(function(data) {
                    self.targetNode.innerHTML = data;
                    var template = $("template", self.targetNode)[0];
                    var script = $("script", self.targetNode)[0].textContent;
                    console.log("node", template);
                    self.targetNode.appendChild(template.content);
                    var e = function(script) {
                        eval(script);
                    };
                    e.call(self.targetNode, script);
                });
        }, 1);


    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            if ( ! self._shadowDom) {
                self.targetNode = document.createElement("div");
                self.appendChild(self.targetNode);

            } else {
                console.log("with shadow");
                self.targetNode = self.attachShadow({mode: 'open'});
            }

        }, 1);
    }


}



customElements.define("cj-pane", CJPaneElement);

class CJTimerElement extends CJHtmlElement {



    constructor() {
        super();
        this._interval = null;
        this._intervalObj = null;
        this.targetNode = null;
        this._timeout = 1;
    }

    static get observedAttributes() { return ["interval", "timeout", ...CJHtmlElement.observedAttributes]; }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "interval":
                this._interval = newValue;
                break;

            case "timeout":
                this._timeout = newValue;
                break;
        }
    }


    clearInterval() {
        if (this._intervalObj !== null) {
            window.clearInterval(this._intervalObj)
        }
    }

    connectedCallback() {
        var self = this;

        console.log("Timer connected");
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            self.targetNode = document.createElement("div");
            self.appendChild(self.targetNode);
            var template = $("template", self)[0].content;
            if (self._interval !== null) {
                self._intervalObj = window.setInterval(function() {
                    var myNode = self.targetNode;
                    while (myNode.firstChild) {
                        myNode.removeChild(myNode.firstChild);
                    }
                    console.log("append", template);
                    myNode.appendChild(template.cloneNode(true));
                }, self._interval);
            }
        }, self._timeout);
    }

    disconnectedCallback() {
        this.clearInterval();
    }

}



customElements.define("cj-timer", CJTimerElement);



class CJRenderer {

    constructor() {
        CJRenderer.renderer = this;
    }

    boolEval(scope, code) {
        let ret = ((scope, _code) => {
            let __ret = null;

            let gencode = `__ret = ${_code};`;
            eval(gencode);

            return __ret;
        })(scope, code);
        return ret;
    }

    forEval(scope, code, targetNode, tplNode) {
        let reg = /^([a-zA-Z0-9_.\[\]]+)\s+as\s+([a-zA-Z0-9_.\[\]]+)$/.exec(code);
        console.log(reg);
        let genCode = `
                for(let index = 0; index < ${reg[1]}.length; index++){
                    var ${reg[2]} = ${reg[1]}[index];
                    let curClone = tplNode.cloneNode(false);
                    //curClone.textContent = tplNode.textContent;
                    targetNode.appendChild(curClone);
                    for(let i = 0; i < tplNode.childNodes.length; i++) {
                        this.renderInto(curClone, scope, tplNode.childNodes[i]);
                    }
                }`;
        console.log("eval", genCode);
        return eval(genCode);
    }

    evalText(scope, text) {
        //let textWrapper = document.createTextNode("");

        return text.replace(/\{\{(.*?)\}\}/g, function(match, p1) {
            let __ret = null;
            eval(`__ret = ${p1};`);
            return __ret;
        })
    }


    registerCallbacks(targetNode, scope) {
        let eventAttr = targetNode.getAttribute("(click)");
        if (eventAttr !== null) {
            let code = this.evalText(scope, eventAttr);
            targetNode.addEventListener("click", e => {
                eval(code);
            });
        }
    }



    /**
     * @param targetNode {HTMLElement}
     * @param data
     * @param curTemplateNode {HTMLElement}
     */
    renderInto(targetNode, scope, tplNode) {
        if(typeof tplNode === "undefined") {
            tplNode = this.templateDom;
        }

        ((e, a) => {
            console.log(targetNode);
        })(e,a);

        /*
        for(let i = 0; i < targetNode.children.length; i++) {
            targetNode.removeChild(targetNode.children[i]);
        }
        */

        if (tplNode instanceof HTMLTemplateElement) {
            for(let i = 0; i < tplNode.content.childNodes.length; i++) {
                this.renderInto(targetNode, scope, tplNode.content.childNodes[i]);
            }
            return
        }

        if (tplNode instanceof Text) {
            let textNode = tplNode.cloneNode(true);
            textNode.textContent = this.evalText(scope, textNode.textContent);

            targetNode.appendChild(textNode);
            return;
        }

        console.log(tplNode);




        this.registerCallbacks(targetNode, scope);

        if(tplNode.hasAttribute("if$")) {
            if(this.boolEval(scope, tplNode.getAttribute("if$")) === false) {
                return false;
            }
        }



        if(tplNode.hasAttribute("for$")) {
            // Append foreach elements
            let forCode = tplNode.getAttribute("for$");
            this.forEval(scope, forCode, targetNode, tplNode);
            return false;
        } else {
            // Append child elements
            let curClone = tplNode.cloneNode(false);
            targetNode.appendChild(curClone);

            for(let i = 0; i < tplNode.childNodes.length; i++) {
                this.renderInto(curClone, scope, tplNode.childNodes[i]);
            }
        }
    }

    parseNode(node, scope) {
        let tplNode = node.cloneNode(true);
        for(let i = 0; i < node.childNodes.length; i++) {
            node.removeChild(node.childNodes[i]);
        }
        let target = document.createElement(node.tagName);
        this.renderInto(target, scope, tplNode);
        node.replaceWith(target);
    }
}


class CJTplElement extends HTMLElement {

    constructor() {
        super();
        this.ajaxSrc = null;
        this.templateNode = null;
        this.targetNode = null;
        this._data = null;
    }


    reload() {
        var renderer = new CJRenderer();
        this.targetNode.innerHTML = "";
        renderer.renderInto(this.targetNode, {}, this.templateNode);
    }


    static get observedAttributes() { return ["ajax-src"]; }


    attributeChangedCallback(name, oldValue, newValue) {
        console.log(this);
        switch (name) {
            case "ajax-src":
                this.ajaxSrc = newValue;
                break;
        }
    }





    setData(data) {
        this._data = data;
        var renderer = new CJRenderer();
        this.targetNode.innerHTML = "";
        renderer.renderInto(this.targetNode, this._data, this.templateNode);
    }



    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout( function () {
            console.log("ready");

            self.templateNode = self.firstElementChild;
            self.targetNode = document.createElement("div");
            self.appendChild(self.targetNode);

            //self.setData({});

            console.log("connect", self.templateNode);
            //this.templateNode = this.content.childNodes[0].cloneNode(true);



        }, 1);

    }

}


customElements.define("cj-tpl", CJTplElement);



class HtmlTemplate {

    /**
     *
     * @param {Node} templateElement
     */
    constructor (templateElement) {
        /* @var {Node} */
        this.tplRoot = templateElement;
        this.targetRoot = null;
    }

    setTarget (targetElement) {
        this.targetRoot = targetElement;
    }



    render(scope) {
        var curTpl = this.tplRoot;

        while(true) {



        }




    }









}
/**
 *
 * @param {Node} source
 * @param {Node} target
 * @param scope
 */
function cj_render(source, target, scope) {
    "use strict";


    var __reservedWords = [
        "new", "let", "var", "const", "scope", "true", "false", "in", "of"
    ];

    function rewriteExpre(expr) {
        return expr.replace(/(^|\s|\[|\()(\w+)/g, (match, space, varName) => {
                console.log("matches", space, varName);
                if (__reservedWords.indexOf(varName) > -1)
                    return match;
                if (!isNaN(parseFloat(varName)) && isFinite(varName))
                    return match;
                return space + "scope." + varName;
            });
    }

    var func = {

        "for$": (scope, _r_source, _r_target, _r_expr) => {

            var ____eval = 'for (' + _r_expr + ") { ____renderFn(scope, _r_source, _r_target, true); };";
            console.log("for", scope, this, _r_expr, ____eval);
            try {
                eval(____eval);
            } catch (_e) {
                throw `Error in statement for$='${_r_expr}': ` + _e;
            }
            return false;
        },
        "each$": (scope, _r_source, _r_target, _r_expr) => {
            var ____matches = _r_expr.match(/^(.*?) as (.*?)(\=\>(.*?))$/);
            console.log(____matches);
            if (____matches.length == 5) {
                var ____eval = `for (${____matches[2]} in ${____matches[1]}) { ${____matches[4]} = ${____matches[1]}[${____matches[2]}]; ____renderFn(scope, _r_source, _r_target, true); };`;
            } else {
                throw `Invalid each$='${_r_expr}' syntax.`;
            }
            console.log(____eval);
            eval(____eval);
            return false;
        },
        "if$": (scope, _r_source, _r_target, _r_expr) => {
            console.log("if", scope, this, _r_expr);
            var _____eval = 'if (' + _r_expr + ") { ____renderFn(scope, _r_source, _r_target, true); };";
            eval(_____eval);
            return false;
        },
        "__eval__": (scope, _r_input) => {
            var wurst = "bah";
            console.log("eval:", scope, this);
            _r_input = _r_input.replace(/\{\{(.*?)\}\}/g, (match, contents) => {
                try {
                    contents = rewriteExpre(contents);
                    return eval(contents);
                } catch (_e) {
                    throw `Èrror in inline statement ${match} in text block '${_r_input}': ` + _e;
                }
            });
            return _r_input;
        }
    };

    /**
     * These functions are applied after the result Node was created (after the loop)
     *
     * @type {{class$: (function(*, *, *=, *): boolean)}}
     */
    var modifiers = {
        "class$": (scope, _r_source, _r_target, _r_expr, _r_resultNode) => {
            eval("var _r_expr = " + _r_expr);
            for (let __curClassName in _r_expr) {
                if (_r_expr[__curClassName]) {
                    _r_resultNode.classList.add(__curClassName);
                }
            }
            return true;
        }
    };

    var ____renderFn = (scope, source, target, noParseAttrs) => {
        console.log ("render.scope", scope, this);
        console.log ("node type", source.nodeType);
        if (source.nodeType === 1) {
            console.log("walk", source, target)

            var newTarget = source.cloneNode(false);
            if ( ! noParseAttrs) {
                for (let curFunc in func) {
                    if (source.hasAttribute(curFunc)) {
                        console.log(curFunc, source, target);
                        let ret = func[curFunc].call(scope, scope, source, target, rewriteExpre(source.getAttribute(curFunc)), newTarget);
                        if (ret === false)
                            return;
                    }
                }
            }

            for (let curFunc in modifiers) {
                if (source.hasAttribute(curFunc)) {
                    console.log(curFunc, source, target);
                    let ret = modifiers[curFunc].call(scope, scope, source, target, rewriteExpre(source.getAttribute(curFunc)), newTarget);
                    if (ret === false)
                        return;
                }
            }

            target.appendChild(newTarget);

            for (var i1 = 0; i1 < source.childNodes.length; i1++) {
                var curSource1 = source.childNodes[i1];


                // Render content nodes into previous target.
                ____renderFn.call({}, scope, curSource1, newTarget);
            }
        } else if (source.nodeType === 3) {
            var _new_elem = source.cloneNode(false);
            _new_elem.textContent = func.__eval__.call(scope, scope, _new_elem.textContent);
            target.appendChild(_new_elem);
        } else {
            //if ()
            console.log ("normal node", source, target);
            target.appendChild(source.cloneNode(false));
            return;
        }
    };
    // @todo check if it is a template node and use contentElements

    // Walk all childs
    for (var i = 0; i < source.childNodes.length; i++) {
        var curSource = source.childNodes[i];
        // Render content nodes into previous target.
        ____renderFn.call({}, scope, curSource, target);
    }
}

class TplNode {

}






function __compiled_tplx(scope, _cur_node) {
    for (var wurst in scope.a) {
        _cur_node.appendChild(document.createElement("div"))
    }
}



class TplCompiler {

    constructor() {
        this.attrs = {
            "for$": function (tplNode) {

            }
        }
    }



    compile(node) {
        var wurst = "muh"



        node.getAttrib


    }


}

class CJAjaxFormElement extends CJFormElement {
    constructor() {
        super();
        this.ajaxAction = null;
        this.preload = false;
        this.onsuccess = null;
    }


    static get observedAttributes() { return ["ajax-action", "preload", "onsuccess", ...CJFormElement.observedAttributes]; }


    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "ajax-action":
                this.ajaxAction = newValue;
                break;
            case "preload":
                this.preload = true;
                break;
            case "onsuccess":
                this.onsuccess = newValue;
                break;
        }
    }



    _on_submit_click(e) {
        e.preventDefault();
        e.stopPropagation();
        this._submitButton.prop("disabled", true);
        this._submitButton.addClass("loading");

        let formData = {};
        this._formElements = $("input, textarea, checkbox", this);
        this._formElements.each((i, e) => this._gather_form_data(e, formData));
        this._formElements.prop("disabled", true);
        let ajaxOptions = CompCore.instance.ajaxOptions;
        ajaxOptions["method"] = "post";
        ajaxOptions["url"] = this.ajaxAction;
        ajaxOptions["data"] = JSON.stringify(formData);
        ajaxOptions["contentType"] = "application/json; charset=utf-8";
        ajaxOptions["dataType"] = "json";

        var self = this;
        jQuery.ajax(ajaxOptions).done(
            function (data) {
                //self._submitButton.prop("disabled", false);
                self._submitButton.removeClass("loading");
                self._submitButton.addClass("saved");
                //self._formElements.prop("disabled", false);
                if (self.onsuccess !== null) {
                    let r = eval(self.onsuccess);
                    if (typeof r === "function")
                        r(this, data);
                }

            }
        );

    }

    connectedCallback() {
        this._submitButton = $("button[type='submit'], input[type='submit']", this);
        this._submitButton.click(e => this._on_submit_click(e));
        this._formElements = $("input, textarea, checkbox", this);

        if (this.preload) {
            this._formElements.prop("disabled", true);
            let self = this;
            jQuery.ajax(this.ajaxAction, CompCore.instance.ajaxOptions)
                .done(function(data) {
                    self._fill_data(data);
                    self._formElements.prop("disabled", false);
                });
        }
    }
}


customElements.define("cj-ajax-form", CJAjaxFormElement);


class CjScriptElement extends CJHtmlElement {



    constructor() {
        super();
    }

    connectedCallback() {
        var self = this;
        /* setTimeout(): make it work on chrome and opera to support dynamic instanciation - otherwise childElements will be empty*/
        setTimeout(function () {
            var content = self.innerText;
            self.textContent = "";
            console.log("eval", content);
            eval(content);
            /*
            var script = document.createElement("script");
            script.textContent = content;
            self.appendChild(script);
            */

        }, 1);
    }


}

customElements.define("cj-script", CjScriptElement);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ0cGwvSHRtbFRlbXBsYXRlLmpzIiwidHBsL1RlbXBsYXRlLmpzIiwidHBsL1RwbENvbXBpbGVyLmpzIiwieGVsZW0vQ0pBamF4Rm9ybUVsZW1lbnQuanMiLCJ4ZWxlbS9DSlNjcmlwdEVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29tcGpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNsYXNzIGMge1xuXG5cbiAgICAvKipcbiAgICAgKiBIVFRQIENsaWVudCBmb3IgQWpheCBSZXF1ZXN0c1xuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB1cmxcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgc3RhdGljIHJlcSAodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ0pfUmVxKHVybCk7XG4gICAgfVxuXG5cblxuXG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDakhpZ2hsaWdodEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGhpZ2hsaWdodChpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDakhpZ2hsaWdodEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcbiAgICAgICAgICAgIGRhdGE6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZFxuICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aFBhcmFtcyhwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmRhdGEgPSBwYXJhbXM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYm9keVxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICB3aXRoQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09PSBcIkdFVFwiKVxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm1ldGhvZCA9IFwiUE9TVFwiO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShib2R5KSB8fCB0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmJvZHkgPSBib2R5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXQganNvbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwianNvblwiKVxuICAgIH1cblxuICAgIHNldCBwbGFpbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIG51bGwpXG4gICAgfVxuXG4gICAgc2V0IHN0cmVhbShmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwic3RyZWFtXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZuXG4gICAgICogQHBhcmFtIGZpbHRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VfcmVxdWVzdChmbiwgZmlsdGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdC5zdWNjZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIgPT09IFwianNvblwiKVxuICAgICAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgZm4oZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgICQuYWpheCh0aGlzLnJlcXVlc3QpO1xuICAgIH1cblxufSIsIlxuY2xhc3MgQ0pIdG1sRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmRlYnVnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJkZWJ1Z1wiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIExvZyBvdXRwdXQgKGlmIGRlYnVnIGlzIG9uKVxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqIEBwYXJhbSBwYXJhbTFcbiAgICAgKiBAcGFyYW0gcGFyYW0yXG4gICAgICovXG4gICAgX2xvZyhwYXJhbTEsIHBhcmFtMikge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZylcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMsIC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuXG59IiwiY2xhc3MgQ29tcENvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zID0ge1xuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9uc0h0bWwgPSB7XG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakV4ZWNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlTm9kZSA9IHNlbGYucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGVOb2RlLnRhZ05hbWUgIT09IFwiUFJFXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkNhbm5vdCBmaW5kIHNpYmxpbmcgPHByZT4gbm9kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvZGVOb2RlID0gY29kZU5vZGUucXVlcnlTZWxlY3RvcihcImNvZGVcIik7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJ0ZXh0Q29udGVudD1cIiwgY29kZU5vZGUudGV4dENvbnRlbnQpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbm5lckhUTUwgPSBjb2RlTm9kZS50ZXh0Q29udGVudDtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwic2NyaXB0XCIsIHNlbGYpLmVhY2goZnVuY3Rpb24oaWR4LCBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChub2RlLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0sMSk7XG5cblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWV4ZWNcIiwgQ2pFeGVjRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuX2NvZGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYW5nID0gXCJodG1sXCJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImxhbmdcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsYW5nXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5sYW5nID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGV4dCB0byBoaWdobGlnaHRcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgdGhlIGNvZGUgdG8gaGlnaHRsaWdodFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVHlwZSBUaGUgaGlnaGxpZ2h0ZXIgdG8gdXNlIChodG1sfHRleHR8anMpXG4gICAgICovXG4gICAgc2V0Q29kZShjb2RlLCBjb2RlVHlwZSkge1xuICAgICAgICBpZiAoY29kZVR5cGUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGNvZGVUeXBlID0gdGhpcy5sYW5nO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gY29kZTtcbiAgICAgICAgaWYgKHRoaXMuX2NvZGVFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5pbm5lclRleHQgPSBjb2RlO1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2RlVHlwZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJjb250ZW50IHRvIGhpZ2hsaWdodFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQocHJlKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY29kZUVsZW1lbnQgPSBjb2RlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuY2xhc3NMaXN0LmFkZChzZWxmLmxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiLCBcIm9uY2hhbmdlXCIsIFwiZGVib3VuY2VcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Ym1pdFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgcmV0KSk7XG4gICAgICAgIHRoaXMuX2xvZyhcImdldERhdGEoKTpcIiwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGZvcm1OYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICBpZiAoZm9ybU5hbWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGZvcm1OYW1lID0gZm9ybS5pZDtcblxuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFPYmpbZm9ybU5hbWVdID09IGZvcm0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9sb2coXCJzZXREYXRhKClcIiwgZGF0YSk7XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICB0aGlzLl9sb2coXCJfc3VibWl0KFwiLCBlLCBcIik7IGNhbGxpbmc6IG9uc3VibWl0PVwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcbmNsYXNzIENKT3B0aW9uc0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBbXTtcblxuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImZvclwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImZvclwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlZnJlc2goKSB7XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdGhpcy5fb3B0aW9ucy5mb3JFYWNoKGksIGVsZW0gPT4ge1xuICAgICAgICAgICAgdGhpcy5fbG9nKFwiYWRkXCIsIGksIGVsZW0pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBlbGVtLnRleHQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCwgdGV4dCA9IGVsZW07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0aW9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHZhbCk7XG4gICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9sb2coXCJjai1vYmplY3Rpb24gY29ubmVjdGVkKClcIik7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibXVoXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYudGV4dENvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLl9vcHRpb25zID0gSlNPTi5wYXJzZShzZWxmLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJMb2FkaW5nIG9wdGlvbnMgcHJlc2V0IGZyb20ganNvbjpcIiwgc2VsZi5fb3B0aW9ucylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgc2VsZi5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1vcHRpb25zXCIsIENKT3B0aW9uc0VsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcInNyY1wiLCBcInNoYWRvdy1kb21cIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmLnRhcmdldE5vZGUpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHQgPSAkKFwic2NyaXB0XCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF0udGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlXCIsIHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBmdW5jdGlvbihzY3JpcHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZS5jYWxsKHNlbGYudGFyZ2V0Tm9kZSwgc2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCAhIHNlbGYuX3NoYWRvd0RvbSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIndpdGggc2hhZG93XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiY2xhc3MgQ0pUaW1lckVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbE9iaiA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiaW50ZXJ2YWxcIiwgXCJ0aW1lb3V0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiaW50ZXJ2YWxcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwidGltZW91dFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVvdXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY2xlYXJJbnRlcnZhbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ludGVydmFsT2JqICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9pbnRlcnZhbE9iailcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBjb25uZWN0ZWRcIik7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmKVswXS5jb250ZW50O1xuICAgICAgICAgICAgaWYgKHNlbGYuX2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW50ZXJ2YWxPYmogPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBteU5vZGUgPSBzZWxmLnRhcmdldE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChteU5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXlOb2RlLnJlbW92ZUNoaWxkKG15Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImFwcGVuZFwiLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIG15Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH0sIHNlbGYuX2ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgc2VsZi5fdGltZW91dCk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgIH1cblxufVxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdGltZXJcIiwgQ0pUaW1lckVsZW1lbnQpO1xuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyICR7cmVnWzJdfSA9ICR7cmVnWzFdfVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jdXJDbG9uZS50ZXh0Q29udGVudCA9IHRwbE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWA7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBnZW5Db2RlKTtcbiAgICAgICAgcmV0dXJuIGV2YWwoZ2VuQ29kZSk7XG4gICAgfVxuXG4gICAgZXZhbFRleHQoc2NvcGUsIHRleHQpIHtcbiAgICAgICAgLy9sZXQgdGV4dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblxuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICAgIGxldCBfX3JldCA9IG51bGw7XG4gICAgICAgICAgICBldmFsKGBfX3JldCA9ICR7cDF9O2ApO1xuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgcmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpIHtcbiAgICAgICAgbGV0IGV2ZW50QXR0ciA9IHRhcmdldE5vZGUuZ2V0QXR0cmlidXRlKFwiKGNsaWNrKVwiKTtcbiAgICAgICAgaWYgKGV2ZW50QXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGNvZGUgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCBldmVudEF0dHIpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZSA9PiB7XG4gICAgICAgICAgICAgICAgZXZhbChjb2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgKChlLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXROb2RlKTtcbiAgICAgICAgfSkoZSxhKTtcblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHJlbG9hZCgpIHtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8odGhpcy50YXJnZXROb2RlLCB7fSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LXNyY1wiXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwgdGhpcy5fZGF0YSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG5cbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIC8vc2VsZi5zZXREYXRhKHt9KTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cblxuXG4gICAgICAgIH0sIDEpO1xuXG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdHBsXCIsIENKVHBsRWxlbWVudCk7XG4iLCJcblxuY2xhc3MgSHRtbFRlbXBsYXRlIHtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOb2RlfSB0ZW1wbGF0ZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAodGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgIC8qIEB2YXIge05vZGV9ICovXG4gICAgICAgIHRoaXMudHBsUm9vdCA9IHRlbXBsYXRlRWxlbWVudDtcbiAgICAgICAgdGhpcy50YXJnZXRSb290ID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXRUYXJnZXQgKHRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy50YXJnZXRSb290ID0gdGFyZ2V0RWxlbWVudDtcbiAgICB9XG5cblxuXG4gICAgcmVuZGVyKHNjb3BlKSB7XG4gICAgICAgIHZhciBjdXJUcGwgPSB0aGlzLnRwbFJvb3Q7XG5cbiAgICAgICAgd2hpbGUodHJ1ZSkge1xuXG5cblxuICAgICAgICB9XG5cblxuXG5cbiAgICB9XG5cblxuXG5cblxuXG5cblxuXG59IiwiLyoqXG4gKlxuICogQHBhcmFtIHtOb2RlfSBzb3VyY2VcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0gc2NvcGVcbiAqL1xuZnVuY3Rpb24gY2pfcmVuZGVyKHNvdXJjZSwgdGFyZ2V0LCBzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG5cbiAgICB2YXIgX19yZXNlcnZlZFdvcmRzID0gW1xuICAgICAgICBcIm5ld1wiLCBcImxldFwiLCBcInZhclwiLCBcImNvbnN0XCIsIFwic2NvcGVcIiwgXCJ0cnVlXCIsIFwiZmFsc2VcIiwgXCJpblwiLCBcIm9mXCJcbiAgICBdO1xuXG4gICAgZnVuY3Rpb24gcmV3cml0ZUV4cHJlKGV4cHIpIHtcbiAgICAgICAgcmV0dXJuIGV4cHIucmVwbGFjZSgvKF58XFxzfFxcW3xcXCgpKFxcdyspL2csIChtYXRjaCwgc3BhY2UsIHZhck5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm1hdGNoZXNcIiwgc3BhY2UsIHZhck5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChfX3Jlc2VydmVkV29yZHMuaW5kZXhPZih2YXJOYW1lKSA+IC0xKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhck5hbWUpKSAmJiBpc0Zpbml0ZSh2YXJOYW1lKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgICAgICAgICAgIHJldHVybiBzcGFjZSArIFwic2NvcGUuXCIgKyB2YXJOYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGZ1bmMgPSB7XG5cbiAgICAgICAgXCJmb3IkXCI6IChzY29wZSwgX3Jfc291cmNlLCBfcl90YXJnZXQsIF9yX2V4cHIpID0+IHtcblxuICAgICAgICAgICAgdmFyIF9fX19ldmFsID0gJ2ZvciAoJyArIF9yX2V4cHIgKyBcIikgeyBfX19fcmVuZGVyRm4oc2NvcGUsIF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCB0cnVlKTsgfTtcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZm9yXCIsIHNjb3BlLCB0aGlzLCBfcl9leHByLCBfX19fZXZhbCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGV2YWwoX19fX2V2YWwpO1xuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgRXJyb3IgaW4gc3RhdGVtZW50IGZvciQ9JyR7X3JfZXhwcn0nOiBgICsgX2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZWFjaCRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgdmFyIF9fX19tYXRjaGVzID0gX3JfZXhwci5tYXRjaCgvXiguKj8pIGFzICguKj8pKFxcPVxcPiguKj8pKSQvKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKF9fX19tYXRjaGVzKTtcbiAgICAgICAgICAgIGlmIChfX19fbWF0Y2hlcy5sZW5ndGggPT0gNSkge1xuICAgICAgICAgICAgICAgIHZhciBfX19fZXZhbCA9IGBmb3IgKCR7X19fX21hdGNoZXNbMl19IGluICR7X19fX21hdGNoZXNbMV19KSB7ICR7X19fX21hdGNoZXNbNF19ID0gJHtfX19fbWF0Y2hlc1sxXX1bJHtfX19fbWF0Y2hlc1syXX1dOyBfX19fcmVuZGVyRm4oc2NvcGUsIF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCB0cnVlKTsgfTtgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgSW52YWxpZCBlYWNoJD0nJHtfcl9leHByfScgc3ludGF4LmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhfX19fZXZhbCk7XG4gICAgICAgICAgICBldmFsKF9fX19ldmFsKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJpZiRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJpZlwiLCBzY29wZSwgdGhpcywgX3JfZXhwcik7XG4gICAgICAgICAgICB2YXIgX19fX19ldmFsID0gJ2lmICgnICsgX3JfZXhwciArIFwiKSB7IF9fX19yZW5kZXJGbihzY29wZSwgX3Jfc291cmNlLCBfcl90YXJnZXQsIHRydWUpOyB9O1wiO1xuICAgICAgICAgICAgZXZhbChfX19fX2V2YWwpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBcIl9fZXZhbF9fXCI6IChzY29wZSwgX3JfaW5wdXQpID0+IHtcbiAgICAgICAgICAgIHZhciB3dXJzdCA9IFwiYmFoXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWw6XCIsIHNjb3BlLCB0aGlzKTtcbiAgICAgICAgICAgIF9yX2lucHV0ID0gX3JfaW5wdXQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgKG1hdGNoLCBjb250ZW50cykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRzID0gcmV3cml0ZUV4cHJlKGNvbnRlbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoY29udGVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGDDiHJyb3IgaW4gaW5saW5lIHN0YXRlbWVudCAke21hdGNofSBpbiB0ZXh0IGJsb2NrICcke19yX2lucHV0fSc6IGAgKyBfZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBfcl9pbnB1dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGFwcGxpZWQgYWZ0ZXIgdGhlIHJlc3VsdCBOb2RlIHdhcyBjcmVhdGVkIChhZnRlciB0aGUgbG9vcClcbiAgICAgKlxuICAgICAqIEB0eXBlIHt7Y2xhc3MkOiAoZnVuY3Rpb24oKiwgKiwgKj0sICopOiBib29sZWFuKX19XG4gICAgICovXG4gICAgdmFyIG1vZGlmaWVycyA9IHtcbiAgICAgICAgXCJjbGFzcyRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwciwgX3JfcmVzdWx0Tm9kZSkgPT4ge1xuICAgICAgICAgICAgZXZhbChcInZhciBfcl9leHByID0gXCIgKyBfcl9leHByKTtcbiAgICAgICAgICAgIGZvciAobGV0IF9fY3VyQ2xhc3NOYW1lIGluIF9yX2V4cHIpIHtcbiAgICAgICAgICAgICAgICBpZiAoX3JfZXhwcltfX2N1ckNsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgX3JfcmVzdWx0Tm9kZS5jbGFzc0xpc3QuYWRkKF9fY3VyQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgX19fX3JlbmRlckZuID0gKHNjb3BlLCBzb3VyY2UsIHRhcmdldCwgbm9QYXJzZUF0dHJzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nIChcInJlbmRlci5zY29wZVwiLCBzY29wZSwgdGhpcyk7XG4gICAgICAgIGNvbnNvbGUubG9nIChcIm5vZGUgdHlwZVwiLCBzb3VyY2Uubm9kZVR5cGUpO1xuICAgICAgICBpZiAoc291cmNlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIndhbGtcIiwgc291cmNlLCB0YXJnZXQpXG5cbiAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSBzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIGlmICggISBub1BhcnNlQXR0cnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJGdW5jIGluIGZ1bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNBdHRyaWJ1dGUoY3VyRnVuYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1ckZ1bmMsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSBmdW5jW2N1ckZ1bmNdLmNhbGwoc2NvcGUsIHNjb3BlLCBzb3VyY2UsIHRhcmdldCwgcmV3cml0ZUV4cHJlKHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYykpLCBuZXdUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBjdXJGdW5jIGluIG1vZGlmaWVycykge1xuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzQXR0cmlidXRlKGN1ckZ1bmMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1ckZ1bmMsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJldCA9IG1vZGlmaWVyc1tjdXJGdW5jXS5jYWxsKHNjb3BlLCBzY29wZSwgc291cmNlLCB0YXJnZXQsIHJld3JpdGVFeHByZShzb3VyY2UuZ2V0QXR0cmlidXRlKGN1ckZ1bmMpKSwgbmV3VGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobmV3VGFyZ2V0KTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaTEgPSAwOyBpMSA8IHNvdXJjZS5jaGlsZE5vZGVzLmxlbmd0aDsgaTErKykge1xuICAgICAgICAgICAgICAgIHZhciBjdXJTb3VyY2UxID0gc291cmNlLmNoaWxkTm9kZXNbaTFdO1xuXG5cbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgY29udGVudCBub2RlcyBpbnRvIHByZXZpb3VzIHRhcmdldC5cbiAgICAgICAgICAgICAgICBfX19fcmVuZGVyRm4uY2FsbCh7fSwgc2NvcGUsIGN1clNvdXJjZTEsIG5ld1RhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc291cmNlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB2YXIgX25ld19lbGVtID0gc291cmNlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICBfbmV3X2VsZW0udGV4dENvbnRlbnQgPSBmdW5jLl9fZXZhbF9fLmNhbGwoc2NvcGUsIHNjb3BlLCBfbmV3X2VsZW0udGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKF9uZXdfZWxlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2lmICgpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJub3JtYWwgbm9kZVwiLCBzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoc291cmNlLmNsb25lTm9kZShmYWxzZSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBAdG9kbyBjaGVjayBpZiBpdCBpcyBhIHRlbXBsYXRlIG5vZGUgYW5kIHVzZSBjb250ZW50RWxlbWVudHNcblxuICAgIC8vIFdhbGsgYWxsIGNoaWxkc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGN1clNvdXJjZSA9IHNvdXJjZS5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAvLyBSZW5kZXIgY29udGVudCBub2RlcyBpbnRvIHByZXZpb3VzIHRhcmdldC5cbiAgICAgICAgX19fX3JlbmRlckZuLmNhbGwoe30sIHNjb3BlLCBjdXJTb3VyY2UsIHRhcmdldCk7XG4gICAgfVxufSIsIlxuY2xhc3MgVHBsTm9kZSB7XG5cbn1cblxuXG5cblxuXG5cbmZ1bmN0aW9uIF9fY29tcGlsZWRfdHBseChzY29wZSwgX2N1cl9ub2RlKSB7XG4gICAgZm9yICh2YXIgd3Vyc3QgaW4gc2NvcGUuYSkge1xuICAgICAgICBfY3VyX25vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSlcbiAgICB9XG59XG5cblxuXG5jbGFzcyBUcGxDb21waWxlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hdHRycyA9IHtcbiAgICAgICAgICAgIFwiZm9yJFwiOiBmdW5jdGlvbiAodHBsTm9kZSkge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29tcGlsZShub2RlKSB7XG4gICAgICAgIHZhciB3dXJzdCA9IFwibXVoXCJcblxuXG5cbiAgICAgICAgbm9kZS5nZXRBdHRyaWJcblxuXG4gICAgfVxuXG5cbn0iLCJcbmNsYXNzIENKQWpheEZvcm1FbGVtZW50IGV4dGVuZHMgQ0pGb3JtRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucHJlbG9hZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG51bGw7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtYWN0aW9uXCIsIFwicHJlbG9hZFwiLCBcIm9uc3VjY2Vzc1wiLCAuLi5DSkZvcm1FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiYWpheC1hY3Rpb25cIjpcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJwcmVsb2FkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Y2Nlc3NcIjpcbiAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWFqYXgtZm9ybVwiLCBDSkFqYXhGb3JtRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqU2NyaXB0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJUZXh0O1xuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgY29udGVudCk7XG4gICAgICAgICAgICBldmFsKGNvbnRlbnQpO1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otc2NyaXB0XCIsIENqU2NyaXB0RWxlbWVudCk7Il19
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYy5qcyIsImNvcmUvY2UuanMiLCJjb3JlL0NKX1JlcXVlc3QuanMiLCJjb3JlL0NKSHRtbEVsZW1lbnQuanMiLCJjb3JlL2NvbXAtY29yZS5qcyIsImRvYy9DakV4ZWNFbGVtZW50LmpzIiwiZG9jL0NqSGlnaGxpZ2h0RWxlbWVudC5qcyIsImZvcm0vQ0pGb3JtRWxlbWVudC5qcyIsImZvcm0vQ0pPcHRpb25zRWxlbWVudC5qcyIsInBhbmUvQ0pQYW5lRWxlbWVudC5qcyIsInRpbWVyL0NKVGltZXIuanMiLCJ0cGwvQ0pSZW5kZXJlci5qcyIsInRwbC9DSlRwbEVsZW1lbnQuanMiLCJ0cGwvSHRtbFRlbXBsYXRlLmpzIiwidHBsL1RlbXBsYXRlLmpzIiwidHBsL1RwbENvbXBpbGVyLmpzIiwieGVsZW0vQ0pBamF4Rm9ybUVsZW1lbnQuanMiLCJ4ZWxlbS9DSlNjcmlwdEVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29tcGpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNsYXNzIGMge1xuXG5cbiAgICAvKipcbiAgICAgKiBIVFRQIENsaWVudCBmb3IgQWpheCBSZXF1ZXN0c1xuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB1cmxcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgc3RhdGljIHJlcSAodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ0pfUmVxKHVybCk7XG4gICAgfVxuXG5cblxuXG5cbn0iLCJcbmNsYXNzIGNlIHtcblxuXG4gICAgc3RhdGljIF9nZXRFbGVtZW50QnlJZChpZCwgdHlwZSkge1xuICAgICAgICB2YXIgZWxlbSA9ICQoXCIjXCIgKyBpZClbMF07XG4gICAgICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IGZvdW5kXCI7XG4gICAgICAgIGlmICh0eXBlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBpZiAoICEgZWxlbSBpbnN0YW5jZW9mIHR5cGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJFbGVtZW50ICNcIiArIGlkICsgXCIgbm90IG9mIHR5cGUgXCIgKyB0eXBlO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm5zIHtDSkZvcm1FbGVtZW50fVxuICAgICAqL1xuICAgIHN0YXRpYyBmb3JtKGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQsIENKRm9ybUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtDakhpZ2hsaWdodEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGhpZ2hsaWdodChpZCkge1xuICAgICAgICByZXR1cm4gY2UuX2dldEVsZW1lbnRCeUlkKGlkLCBDakhpZ2hsaWdodEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqIEByZXR1cm4ge0NKUGFuZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIHBhbmUoaWQpIHtcbiAgICAgICAgcmV0dXJuIGNlLl9nZXRFbGVtZW50QnlJZChpZCwgQ0pQYW5lRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgYW55KGlkKSB7XG4gICAgICAgIHJldHVybiBjZS5fZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIH1cbn0iLCJcblxuY2xhc3MgQ0pfUmVxIHtcblxuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuICAgICAgICB0aGlzLnJlcXVlc3QgPSB7XG4gICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIGJvZHk6IG51bGwsXG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcbiAgICAgICAgICAgIGRhdGE6IG51bGxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZFxuICAgICAqIEBwYXJhbSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuIHtDSl9SZXF9XG4gICAgICovXG4gICAgd2l0aFBhcmFtcyhwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmRhdGEgPSBwYXJhbXM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYm9keVxuICAgICAqIEByZXR1cm4ge0NKX1JlcX1cbiAgICAgKi9cbiAgICB3aXRoQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QubWV0aG9kID09PSBcIkdFVFwiKVxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm1ldGhvZCA9IFwiUE9TVFwiO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShib2R5KSB8fCB0eXBlb2YgYm9keSA9PT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShib2R5KTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0LmJvZHkgPSBib2R5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXQganNvbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwianNvblwiKVxuICAgIH1cblxuICAgIHNldCBwbGFpbihmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIG51bGwpXG4gICAgfVxuXG4gICAgc2V0IHN0cmVhbShmbikge1xuICAgICAgICB0aGlzLl9tYWtlX3JlcXVlc3QoZm4sIFwic3RyZWFtXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGZuXG4gICAgICogQHBhcmFtIGZpbHRlclxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX21ha2VfcmVxdWVzdChmbiwgZmlsdGVyKSB7XG4gICAgICAgIHRoaXMucmVxdWVzdC5zdWNjZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIgPT09IFwianNvblwiKVxuICAgICAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgZm4oZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgICQuYWpheCh0aGlzLnJlcXVlc3QpO1xuICAgIH1cblxufSIsIlxuY2xhc3MgQ0pIdG1sRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmRlYnVnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJkZWJ1Z1wiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJkZWJ1Z1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuZGVidWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIExvZyBvdXRwdXQgKGlmIGRlYnVnIGlzIG9uKVxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqIEBwYXJhbSBwYXJhbTFcbiAgICAgKiBAcGFyYW0gcGFyYW0yXG4gICAgICovXG4gICAgX2xvZyhwYXJhbTEsIHBhcmFtMikge1xuICAgICAgICBpZiAodGhpcy5kZWJ1ZylcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMsIC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuXG59IiwiY2xhc3MgQ29tcENvcmUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFqYXhPcHRpb25zID0ge1xuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBhbGVydCAoXCJFcnJvciBleGVjdXRpbmcgZm9ybSByZXF1ZXN0LlwiKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkVycm9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hamF4T3B0aW9uc0h0bWwgPSB7XG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGFsZXJ0IChcIkVycm9yIGV4ZWN1dGluZyBmb3JtIHJlcXVlc3QuXCIpO1xuICAgICAgICAgICAgICAgIHRocm93IFwiRXJyb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IGluc3RhbmNlICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wQ29yZSgpO1xuICAgIH1cblxuXG4gICAgZXZhbEF0dHIoYXR0clZhbHVlLCBldmVudCwgb3duZXJPYmopIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmFsXCIsIGF0dHJWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRyVmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBldmFsKGF0dHJWYWx1ZSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIm93bmVyXCIsIG93bmVyT2JqKTtcbiAgICAgICAgICAgIHZhciByZXQgPSBjb250ZXh0LmJpbmQob3duZXJPYmopKGV2ZW50KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmV0ICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIHJldHVybiByZXQuYmluZChvd25lck9iaikoZXZlbnQpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyVmFsdWUgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiBhdHRyVmFsdWUoZXZlbnQsIG93bmVyT2JqKTtcblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXZhbCBlcnJvcjpcIiwgYXR0clZhbHVlKVxuICAgICAgICB0aHJvdyBcIkNhbm5vdCBldmFsdWF0ZSBleHByZXNzaW9uIC0gc2VlIG91dHB1dFwiXG4gICAgfVxufVxuXG5cbiIsIlxuXG5jbGFzcyBDakV4ZWNFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG5cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2RlTm9kZSA9IHNlbGYucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGVOb2RlLnRhZ05hbWUgIT09IFwiUFJFXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2xvZyhcIkNhbm5vdCBmaW5kIHNpYmxpbmcgPHByZT4gbm9kZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvZGVOb2RlID0gY29kZU5vZGUucXVlcnlTZWxlY3RvcihcImNvZGVcIik7XG5cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJ0ZXh0Q29udGVudD1cIiwgY29kZU5vZGUudGV4dENvbnRlbnQpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbm5lckhUTUwgPSBjb2RlTm9kZS50ZXh0Q29udGVudDtcblxuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKFwic2NyaXB0XCIsIHNlbGYpLmVhY2goZnVuY3Rpb24oaWR4LCBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChub2RlLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0sMSk7XG5cblxuICAgICAgICAgICAgICAgIH0sIDEpO1xuICAgIH1cblxuXG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWV4ZWNcIiwgQ2pFeGVjRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuX2NvZGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYW5nID0gXCJodG1sXCJcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImxhbmdcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJsYW5nXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5sYW5nID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGV4dCB0byBoaWdobGlnaHRcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSAgICAgdGhlIGNvZGUgdG8gaGlnaHRsaWdodFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVHlwZSBUaGUgaGlnaGxpZ2h0ZXIgdG8gdXNlIChodG1sfHRleHR8anMpXG4gICAgICovXG4gICAgc2V0Q29kZShjb2RlLCBjb2RlVHlwZSkge1xuICAgICAgICBpZiAoY29kZVR5cGUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGNvZGVUeXBlID0gdGhpcy5sYW5nO1xuXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gY29kZTtcbiAgICAgICAgaWYgKHRoaXMuX2NvZGVFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlRWxlbWVudC5pbm5lclRleHQgPSBjb2RlO1xuICAgICAgICAgICAgdGhpcy5fY29kZUVsZW1lbnQuY2xhc3NMaXN0LmFkZChjb2RlVHlwZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImxvYWRcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJjb250ZW50IHRvIGhpZ2hsaWdodFwiLCBjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQocHJlKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgICAgICAgICAgICAgICAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY29kZUVsZW1lbnQgPSBjb2RlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvZGUuY2xhc3NMaXN0LmFkZChzZWxmLmxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50LnRyaW0oKSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZS5pbm5lclRleHQgPSBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICB9LCAxKTtcbiAgICB9XG5cblxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1oaWdobGlnaHRcIiwgQ2pIaWdobGlnaHRFbGVtZW50KTsiLCJcbmNsYXNzIENKRm9ybUVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fc3VibWl0dGFibGVFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5jZl9vbnN1Ym1pdCA9IG51bGw7XG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgIH1cblxuXG4gICAgZ2V0IGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldERhdGEoKTtcbiAgICB9XG5cbiAgICBzZXQgZGF0YSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnNldERhdGEodmFsdWUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJvbnN1Ym1pdFwiLCBcIm9uY2hhbmdlXCIsIFwiZGVib3VuY2VcIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Ym1pdFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuY2Zfb25zdWJtaXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIGZvcm1cbiAgICAgKiBAcGFyYW0gZGF0YU9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhdGhlcl9mb3JtX2RhdGEgKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgc3dpdGNoIChmb3JtLnRhZ05hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJJTlBVVFwiOlxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZm9ybS50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGVja2JveFwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtLmNoZWNrZWQgPT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSBmb3JtLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJTRUxFQ1RcIjpcbiAgICAgICAgICAgICAgICBkYXRhT2JqW2Zvcm0ubmFtZV0gPSAkKGZvcm0pLnZhbCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlRFWFRBUkVBXCI6XG4gICAgICAgICAgICAgICAgZGF0YU9ialtmb3JtLm5hbWVdID0gJChmb3JtKS52YWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgdGhlIGN1cnJlbnRseSB2YWx1ZXMgZnJvbSB0aGUgZm9ybSBhbmQgcmV0dXJuXG4gICAgICogb2JqZWN0IGJhc2VkIG9uIHRoZSBmb3JtcyBuYW1lc1xuICAgICAqXG4gICAgICogQHJldHVybiBvYmplY3RcbiAgICAgKi9cbiAgICBnZXREYXRhKCkge1xuICAgICAgICB2YXIgcmV0ID0ge307XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2dhdGhlcl9mb3JtX2RhdGEoZSwgcmV0KSk7XG4gICAgICAgIHRoaXMuX2xvZyhcImdldERhdGEoKTpcIiwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cblxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmb3JtXG4gICAgICogQHBhcmFtIGRhdGFPYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWxsX2Zvcm1fc2luZ2xlKGZvcm0sIGRhdGFPYmopIHtcbiAgICAgICAgdmFyIGZvcm1OYW1lID0gZm9ybS5uYW1lO1xuICAgICAgICBpZiAoZm9ybU5hbWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGZvcm1OYW1lID0gZm9ybS5pZDtcblxuICAgICAgICBzd2l0Y2ggKGZvcm0udGFnTmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcIklOUFVUXCI6XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmb3JtLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyYWRpb1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFPYmpbZm9ybU5hbWVdID09IGZvcm0udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9ybS52YWx1ZSA9IGRhdGFPYmpbZm9ybU5hbWVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIlNFTEVDVFwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJURVhUQVJFQVwiOlxuICAgICAgICAgICAgICAgIGZvcm0udmFsdWUgPSBkYXRhT2JqW2Zvcm1OYW1lXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgZm9ybSBkYXRhIGZyb20gZXh0ZXJuYWwgYW5kIHJlcmVuZGVyIHRoZSBpbnB1dCB2YWx1ZXNcbiAgICAgKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqL1xuICAgIHNldERhdGEoZGF0YSkge1xuICAgICAgICB0aGlzLl9sb2coXCJzZXREYXRhKClcIiwgZGF0YSk7XG4gICAgICAgIHZhciBlbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94LCBzZWxlY3RcIiwgdGhpcyk7XG4gICAgICAgIGVsZW1lbnRzLmVhY2goKGksIGUpID0+IHRoaXMuX2ZpbGxfZm9ybV9zaW5nbGUoZSwgZGF0YSkpO1xuICAgIH1cblxuICAgIF9zdWJtaXQoZSkge1xuICAgICAgICB0aGlzLl9sb2coXCJfc3VibWl0KFwiLCBlLCBcIik7IGNhbGxpbmc6IG9uc3VibWl0PVwiLCB0aGlzLmNmX29uc3VibWl0KTtcbiAgICAgICAgQ29tcENvcmUuaW5zdGFuY2UuZXZhbEF0dHIodGhpcy5jZl9vbnN1Ym1pdCwgZSwgdGhpcyk7XG4gICAgfVxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVnaXN0ZXIgZXZlbnQgaGFuZGxlclxuICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50ID0gc2VsZi5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKTtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXR0YWJsZUVsZW1lbnQgPSBzZWxmLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25bdHlwZT0nc3VibWl0J11cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3VibWl0dGFibGVFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdHRhYmxlRWxlbWVudC5vbnN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXQoZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otZm9ybVwiLCBDSkZvcm1FbGVtZW50KTsiLCJcbmNsYXNzIENKT3B0aW9uc0VsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9zZWxlY3RFbGVtZW50SWQgPSBbXTtcblxuICAgIH1cblxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImZvclwiLCAuLi5DSkh0bWxFbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSBcImZvclwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdEVsZW1lbnRJZCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHJlZnJlc2goKSB7XG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdGhpcy5fb3B0aW9ucy5mb3JFYWNoKGksIGVsZW0gPT4ge1xuICAgICAgICAgICAgdGhpcy5fbG9nKFwiYWRkXCIsIGksIGVsZW0pO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBlbGVtLnRleHQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCwgdGV4dCA9IGVsZW07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0aW9uLnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHZhbCk7XG4gICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9sb2coXCJjai1vYmplY3Rpb24gY29ubmVjdGVkKClcIik7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibXVoXCIpO1xuICAgICAgICAgICAgaWYgKHNlbGYudGV4dENvbnRlbnQudHJpbSgpICE9PSBcIlwiKSB7XG5cbiAgICAgICAgICAgICAgICBzZWxmLl9vcHRpb25zID0gSlNPTi5wYXJzZShzZWxmLnRleHRDb250ZW50KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2coXCJMb2FkaW5nIG9wdGlvbnMgcHJlc2V0IGZyb20ganNvbjpcIiwgc2VsZi5fb3B0aW9ucylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgc2VsZi5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgIH1cbn1cblxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjai1vcHRpb25zXCIsIENKT3B0aW9uc0VsZW1lbnQpOyIsIlxyXG5jbGFzcyBDSlBhbmVFbGVtZW50IGV4dGVuZHMgQ0pIdG1sRWxlbWVudCB7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuX3NyYyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXROb2RlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9zaGFkb3dEb20gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcInNyY1wiLCBcInNoYWRvdy1kb21cIiwgLi4uQ0pIdG1sRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXNdOyB9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwic3JjXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zcmMgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zcmMgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sb2FkVXJsKHRoaXMuX3NyYyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInNoYWRvdy1kb21cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NoYWRvd0RvbSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2xvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2FkXCIsIHVybCk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHVybCwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnNIdG1sKVxyXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmLnRhcmdldE5vZGUpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3JpcHQgPSAkKFwic2NyaXB0XCIsIHNlbGYudGFyZ2V0Tm9kZSlbMF0udGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJub2RlXCIsIHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBmdW5jdGlvbihzY3JpcHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZhbChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZS5jYWxsKHNlbGYudGFyZ2V0Tm9kZSwgc2NyaXB0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDEpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLyogc2V0VGltZW91dCgpOiBtYWtlIGl0IHdvcmsgb24gY2hyb21lIGFuZCBvcGVyYSB0byBzdXBwb3J0IGR5bmFtaWMgaW5zdGFuY2lhdGlvbiAtIG90aGVyd2lzZSBjaGlsZEVsZW1lbnRzIHdpbGwgYmUgZW1wdHkqL1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCAhIHNlbGYuX3NoYWRvd0RvbSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIndpdGggc2hhZG93XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gc2VsZi5hdHRhY2hTaGFkb3coe21vZGU6ICdvcGVuJ30pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIDEpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5cclxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otcGFuZVwiLCBDSlBhbmVFbGVtZW50KTtcclxuIiwiY2xhc3MgQ0pUaW1lckVsZW1lbnQgZXh0ZW5kcyBDSkh0bWxFbGVtZW50IHtcblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnRlcnZhbE9iaiA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiaW50ZXJ2YWxcIiwgXCJ0aW1lb3V0XCIsIC4uLkNKSHRtbEVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiaW50ZXJ2YWxcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9pbnRlcnZhbCA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIFwidGltZW91dFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVvdXQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY2xlYXJJbnRlcnZhbCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2ludGVydmFsT2JqICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9pbnRlcnZhbE9iailcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJUaW1lciBjb25uZWN0ZWRcIik7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50YXJnZXROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2VsZi50YXJnZXROb2RlKTtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQoXCJ0ZW1wbGF0ZVwiLCBzZWxmKVswXS5jb250ZW50O1xuICAgICAgICAgICAgaWYgKHNlbGYuX2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW50ZXJ2YWxPYmogPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBteU5vZGUgPSBzZWxmLnRhcmdldE5vZGU7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChteU5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXlOb2RlLnJlbW92ZUNoaWxkKG15Tm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImFwcGVuZFwiLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIG15Tm9kZS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH0sIHNlbGYuX2ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgc2VsZi5fdGltZW91dCk7XG4gICAgfVxuXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xlYXJJbnRlcnZhbCgpO1xuICAgIH1cblxufVxuXG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdGltZXJcIiwgQ0pUaW1lckVsZW1lbnQpO1xuIiwiXG5cbmNsYXNzIENKUmVuZGVyZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIENKUmVuZGVyZXIucmVuZGVyZXIgPSB0aGlzO1xuICAgIH1cblxuICAgIGJvb2xFdmFsKHNjb3BlLCBjb2RlKSB7XG4gICAgICAgIGxldCByZXQgPSAoKHNjb3BlLCBfY29kZSkgPT4ge1xuICAgICAgICAgICAgbGV0IF9fcmV0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGdlbmNvZGUgPSBgX19yZXQgPSAke19jb2RlfTtgO1xuICAgICAgICAgICAgZXZhbChnZW5jb2RlKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KShzY29wZSwgY29kZSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuXG4gICAgZm9yRXZhbChzY29wZSwgY29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSkge1xuICAgICAgICBsZXQgcmVnID0gL14oW2EtekEtWjAtOV8uXFxbXFxdXSspXFxzK2FzXFxzKyhbYS16QS1aMC05Xy5cXFtcXF1dKykkLy5leGVjKGNvZGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhyZWcpO1xuICAgICAgICBsZXQgZ2VuQ29kZSA9IGBcbiAgICAgICAgICAgICAgICBmb3IobGV0IGluZGV4ID0gMDsgaW5kZXggPCAke3JlZ1sxXX0ubGVuZ3RoOyBpbmRleCsrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyICR7cmVnWzJdfSA9ICR7cmVnWzFdfVtpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jdXJDbG9uZS50ZXh0Q29udGVudCA9IHRwbE5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckludG8oY3VyQ2xvbmUsIHNjb3BlLCB0cGxOb2RlLmNoaWxkTm9kZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfWA7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZhbFwiLCBnZW5Db2RlKTtcbiAgICAgICAgcmV0dXJuIGV2YWwoZ2VuQ29kZSk7XG4gICAgfVxuXG4gICAgZXZhbFRleHQoc2NvcGUsIHRleHQpIHtcbiAgICAgICAgLy9sZXQgdGV4dFdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcblxuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9cXHtcXHsoLio/KVxcfVxcfS9nLCBmdW5jdGlvbihtYXRjaCwgcDEpIHtcbiAgICAgICAgICAgIGxldCBfX3JldCA9IG51bGw7XG4gICAgICAgICAgICBldmFsKGBfX3JldCA9ICR7cDF9O2ApO1xuICAgICAgICAgICAgcmV0dXJuIF9fcmV0O1xuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgcmVnaXN0ZXJDYWxsYmFja3ModGFyZ2V0Tm9kZSwgc2NvcGUpIHtcbiAgICAgICAgbGV0IGV2ZW50QXR0ciA9IHRhcmdldE5vZGUuZ2V0QXR0cmlidXRlKFwiKGNsaWNrKVwiKTtcbiAgICAgICAgaWYgKGV2ZW50QXR0ciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGNvZGUgPSB0aGlzLmV2YWxUZXh0KHNjb3BlLCBldmVudEF0dHIpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZSA9PiB7XG4gICAgICAgICAgICAgICAgZXZhbChjb2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB0YXJnZXROb2RlIHtIVE1MRWxlbWVudH1cbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwYXJhbSBjdXJUZW1wbGF0ZU5vZGUge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHJlbmRlckludG8odGFyZ2V0Tm9kZSwgc2NvcGUsIHRwbE5vZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHRwbE5vZGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRwbE5vZGUgPSB0aGlzLnRlbXBsYXRlRG9tO1xuICAgICAgICB9XG5cbiAgICAgICAgKChlLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0YXJnZXROb2RlKTtcbiAgICAgICAgfSkoZSxhKTtcblxuICAgICAgICAvKlxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5yZW1vdmVDaGlsZCh0YXJnZXROb2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgfVxuICAgICAgICAqL1xuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgSFRNTFRlbXBsYXRlRWxlbWVudCkge1xuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRwbE5vZGUuY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldE5vZGUsIHNjb3BlLCB0cGxOb2RlLmNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0cGxOb2RlIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbGV0IHRleHROb2RlID0gdHBsTm9kZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICB0ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHRoaXMuZXZhbFRleHQoc2NvcGUsIHRleHROb2RlLnRleHRDb250ZW50KTtcblxuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hcHBlbmRDaGlsZCh0ZXh0Tm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyh0cGxOb2RlKTtcblxuXG5cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2tzKHRhcmdldE5vZGUsIHNjb3BlKTtcblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImlmJFwiKSkge1xuICAgICAgICAgICAgaWYodGhpcy5ib29sRXZhbChzY29wZSwgdHBsTm9kZS5nZXRBdHRyaWJ1dGUoXCJpZiRcIikpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICBpZih0cGxOb2RlLmhhc0F0dHJpYnV0ZShcImZvciRcIikpIHtcbiAgICAgICAgICAgIC8vIEFwcGVuZCBmb3JlYWNoIGVsZW1lbnRzXG4gICAgICAgICAgICBsZXQgZm9yQ29kZSA9IHRwbE5vZGUuZ2V0QXR0cmlidXRlKFwiZm9yJFwiKTtcbiAgICAgICAgICAgIHRoaXMuZm9yRXZhbChzY29wZSwgZm9yQ29kZSwgdGFyZ2V0Tm9kZSwgdHBsTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBBcHBlbmQgY2hpbGQgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBjdXJDbG9uZSA9IHRwbE5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQoY3VyQ2xvbmUpO1xuXG4gICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHBsTm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnRvKGN1ckNsb25lLCBzY29wZSwgdHBsTm9kZS5jaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHBhcnNlTm9kZShub2RlLCBzY29wZSkge1xuICAgICAgICBsZXQgdHBsTm9kZSA9IG5vZGUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUuY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZS50YWdOYW1lKTtcbiAgICAgICAgdGhpcy5yZW5kZXJJbnRvKHRhcmdldCwgc2NvcGUsIHRwbE5vZGUpO1xuICAgICAgICBub2RlLnJlcGxhY2VXaXRoKHRhcmdldCk7XG4gICAgfVxufSIsIlxuXG5jbGFzcyBDSlRwbEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5hamF4U3JjID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9kYXRhID0gbnVsbDtcbiAgICB9XG5cblxuICAgIHJlbG9hZCgpIHtcbiAgICAgICAgdmFyIHJlbmRlcmVyID0gbmV3IENKUmVuZGVyZXIoKTtcbiAgICAgICAgdGhpcy50YXJnZXROb2RlLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHJlbmRlcmVyLnJlbmRlckludG8odGhpcy50YXJnZXROb2RlLCB7fSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhamF4LXNyY1wiXTsgfVxuXG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJhamF4LXNyY1wiOlxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFNyYyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuXG5cbiAgICBzZXREYXRhKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHZhciByZW5kZXJlciA9IG5ldyBDSlJlbmRlcmVyKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICByZW5kZXJlci5yZW5kZXJJbnRvKHRoaXMudGFyZ2V0Tm9kZSwgdGhpcy5fZGF0YSwgdGhpcy50ZW1wbGF0ZU5vZGUpO1xuICAgIH1cblxuXG5cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvKiBzZXRUaW1lb3V0KCk6IG1ha2UgaXQgd29yayBvbiBjaHJvbWUgYW5kIG9wZXJhIHRvIHN1cHBvcnQgZHluYW1pYyBpbnN0YW5jaWF0aW9uIC0gb3RoZXJ3aXNlIGNoaWxkRWxlbWVudHMgd2lsbCBiZSBlbXB0eSovXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVhZHlcIik7XG5cbiAgICAgICAgICAgIHNlbGYudGVtcGxhdGVOb2RlID0gc2VsZi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICAgIHNlbGYudGFyZ2V0Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgICAgICBzZWxmLmFwcGVuZENoaWxkKHNlbGYudGFyZ2V0Tm9kZSk7XG5cbiAgICAgICAgICAgIC8vc2VsZi5zZXREYXRhKHt9KTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb25uZWN0XCIsIHNlbGYudGVtcGxhdGVOb2RlKTtcbiAgICAgICAgICAgIC8vdGhpcy50ZW1wbGF0ZU5vZGUgPSB0aGlzLmNvbnRlbnQuY2hpbGROb2Rlc1swXS5jbG9uZU5vZGUodHJ1ZSk7XG5cblxuXG4gICAgICAgIH0sIDEpO1xuXG4gICAgfVxuXG59XG5cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otdHBsXCIsIENKVHBsRWxlbWVudCk7XG4iLCJcblxuY2xhc3MgSHRtbFRlbXBsYXRlIHtcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOb2RlfSB0ZW1wbGF0ZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciAodGVtcGxhdGVFbGVtZW50KSB7XG4gICAgICAgIC8qIEB2YXIge05vZGV9ICovXG4gICAgICAgIHRoaXMudHBsUm9vdCA9IHRlbXBsYXRlRWxlbWVudDtcbiAgICAgICAgdGhpcy50YXJnZXRSb290ID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXRUYXJnZXQgKHRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy50YXJnZXRSb290ID0gdGFyZ2V0RWxlbWVudDtcbiAgICB9XG5cblxuXG4gICAgcmVuZGVyKHNjb3BlKSB7XG4gICAgICAgIHZhciBjdXJUcGwgPSB0aGlzLnRwbFJvb3Q7XG5cbiAgICAgICAgd2hpbGUodHJ1ZSkge1xuXG5cblxuICAgICAgICB9XG5cblxuXG5cbiAgICB9XG5cblxuXG5cblxuXG5cblxuXG59IiwiLyoqXG4gKlxuICogQHBhcmFtIHtOb2RlfSBzb3VyY2VcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0gc2NvcGVcbiAqL1xuZnVuY3Rpb24gY2pfcmVuZGVyKHNvdXJjZSwgdGFyZ2V0LCBzY29wZSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG5cbiAgICB2YXIgX19yZXNlcnZlZFdvcmRzID0gW1xuICAgICAgICBcIm5ld1wiLCBcImxldFwiLCBcInZhclwiLCBcImNvbnN0XCIsIFwic2NvcGVcIiwgXCJ0cnVlXCIsIFwiZmFsc2VcIiwgXCJpblwiLCBcIm9mXCJcbiAgICBdO1xuXG4gICAgZnVuY3Rpb24gcmV3cml0ZUV4cHJlKGV4cHIpIHtcbiAgICAgICAgcmV0dXJuIGV4cHIucmVwbGFjZSgvKF58XFxzfFxcW3xcXCgpKFxcdyspL2csIChtYXRjaCwgc3BhY2UsIHZhck5hbWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm1hdGNoZXNcIiwgc3BhY2UsIHZhck5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChfX3Jlc2VydmVkV29yZHMuaW5kZXhPZih2YXJOYW1lKSA+IC0xKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhck5hbWUpKSAmJiBpc0Zpbml0ZSh2YXJOYW1lKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgICAgICAgICAgICAgIHJldHVybiBzcGFjZSArIFwic2NvcGUuXCIgKyB2YXJOYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIGZ1bmMgPSB7XG5cbiAgICAgICAgXCJmb3IkXCI6IChzY29wZSwgX3Jfc291cmNlLCBfcl90YXJnZXQsIF9yX2V4cHIpID0+IHtcblxuICAgICAgICAgICAgdmFyIF9fX19ldmFsID0gJ2ZvciAoJyArIF9yX2V4cHIgKyBcIikgeyBfX19fcmVuZGVyRm4oc2NvcGUsIF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCB0cnVlKTsgfTtcIjtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZm9yXCIsIHNjb3BlLCB0aGlzLCBfcl9leHByLCBfX19fZXZhbCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGV2YWwoX19fX2V2YWwpO1xuICAgICAgICAgICAgfSBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgRXJyb3IgaW4gc3RhdGVtZW50IGZvciQ9JyR7X3JfZXhwcn0nOiBgICsgX2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZWFjaCRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgdmFyIF9fX19tYXRjaGVzID0gX3JfZXhwci5tYXRjaCgvXiguKj8pIGFzICguKj8pKFxcPVxcPiguKj8pKSQvKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKF9fX19tYXRjaGVzKTtcbiAgICAgICAgICAgIGlmIChfX19fbWF0Y2hlcy5sZW5ndGggPT0gNSkge1xuICAgICAgICAgICAgICAgIHZhciBfX19fZXZhbCA9IGBmb3IgKCR7X19fX21hdGNoZXNbMl19IGluICR7X19fX21hdGNoZXNbMV19KSB7ICR7X19fX21hdGNoZXNbNF19ID0gJHtfX19fbWF0Y2hlc1sxXX1bJHtfX19fbWF0Y2hlc1syXX1dOyBfX19fcmVuZGVyRm4oc2NvcGUsIF9yX3NvdXJjZSwgX3JfdGFyZ2V0LCB0cnVlKTsgfTtgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBgSW52YWxpZCBlYWNoJD0nJHtfcl9leHByfScgc3ludGF4LmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhfX19fZXZhbCk7XG4gICAgICAgICAgICBldmFsKF9fX19ldmFsKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJpZiRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwcikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJpZlwiLCBzY29wZSwgdGhpcywgX3JfZXhwcik7XG4gICAgICAgICAgICB2YXIgX19fX19ldmFsID0gJ2lmICgnICsgX3JfZXhwciArIFwiKSB7IF9fX19yZW5kZXJGbihzY29wZSwgX3Jfc291cmNlLCBfcl90YXJnZXQsIHRydWUpOyB9O1wiO1xuICAgICAgICAgICAgZXZhbChfX19fX2V2YWwpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBcIl9fZXZhbF9fXCI6IChzY29wZSwgX3JfaW5wdXQpID0+IHtcbiAgICAgICAgICAgIHZhciB3dXJzdCA9IFwiYmFoXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWw6XCIsIHNjb3BlLCB0aGlzKTtcbiAgICAgICAgICAgIF9yX2lucHV0ID0gX3JfaW5wdXQucmVwbGFjZSgvXFx7XFx7KC4qPylcXH1cXH0vZywgKG1hdGNoLCBjb250ZW50cykgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRzID0gcmV3cml0ZUV4cHJlKGNvbnRlbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2YWwoY29udGVudHMpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGDDiHJyb3IgaW4gaW5saW5lIHN0YXRlbWVudCAke21hdGNofSBpbiB0ZXh0IGJsb2NrICcke19yX2lucHV0fSc6IGAgKyBfZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBfcl9pbnB1dDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGFwcGxpZWQgYWZ0ZXIgdGhlIHJlc3VsdCBOb2RlIHdhcyBjcmVhdGVkIChhZnRlciB0aGUgbG9vcClcbiAgICAgKlxuICAgICAqIEB0eXBlIHt7Y2xhc3MkOiAoZnVuY3Rpb24oKiwgKiwgKj0sICopOiBib29sZWFuKX19XG4gICAgICovXG4gICAgdmFyIG1vZGlmaWVycyA9IHtcbiAgICAgICAgXCJjbGFzcyRcIjogKHNjb3BlLCBfcl9zb3VyY2UsIF9yX3RhcmdldCwgX3JfZXhwciwgX3JfcmVzdWx0Tm9kZSkgPT4ge1xuICAgICAgICAgICAgZXZhbChcInZhciBfcl9leHByID0gXCIgKyBfcl9leHByKTtcbiAgICAgICAgICAgIGZvciAobGV0IF9fY3VyQ2xhc3NOYW1lIGluIF9yX2V4cHIpIHtcbiAgICAgICAgICAgICAgICBpZiAoX3JfZXhwcltfX2N1ckNsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgX3JfcmVzdWx0Tm9kZS5jbGFzc0xpc3QuYWRkKF9fY3VyQ2xhc3NOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgX19fX3JlbmRlckZuID0gKHNjb3BlLCBzb3VyY2UsIHRhcmdldCwgbm9QYXJzZUF0dHJzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nIChcInJlbmRlci5zY29wZVwiLCBzY29wZSwgdGhpcyk7XG4gICAgICAgIGNvbnNvbGUubG9nIChcIm5vZGUgdHlwZVwiLCBzb3VyY2Uubm9kZVR5cGUpO1xuICAgICAgICBpZiAoc291cmNlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIndhbGtcIiwgc291cmNlLCB0YXJnZXQpXG5cbiAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSBzb3VyY2UuY2xvbmVOb2RlKGZhbHNlKTtcbiAgICAgICAgICAgIGlmICggISBub1BhcnNlQXR0cnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjdXJGdW5jIGluIGZ1bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNBdHRyaWJ1dGUoY3VyRnVuYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1ckZ1bmMsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXQgPSBmdW5jW2N1ckZ1bmNdLmNhbGwoc2NvcGUsIHNjb3BlLCBzb3VyY2UsIHRhcmdldCwgcmV3cml0ZUV4cHJlKHNvdXJjZS5nZXRBdHRyaWJ1dGUoY3VyRnVuYykpLCBuZXdUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBjdXJGdW5jIGluIG1vZGlmaWVycykge1xuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuaGFzQXR0cmlidXRlKGN1ckZ1bmMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1ckZ1bmMsIHNvdXJjZSwgdGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJldCA9IG1vZGlmaWVyc1tjdXJGdW5jXS5jYWxsKHNjb3BlLCBzY29wZSwgc291cmNlLCB0YXJnZXQsIHJld3JpdGVFeHByZShzb3VyY2UuZ2V0QXR0cmlidXRlKGN1ckZ1bmMpKSwgbmV3VGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobmV3VGFyZ2V0KTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaTEgPSAwOyBpMSA8IHNvdXJjZS5jaGlsZE5vZGVzLmxlbmd0aDsgaTErKykge1xuICAgICAgICAgICAgICAgIHZhciBjdXJTb3VyY2UxID0gc291cmNlLmNoaWxkTm9kZXNbaTFdO1xuXG5cbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgY29udGVudCBub2RlcyBpbnRvIHByZXZpb3VzIHRhcmdldC5cbiAgICAgICAgICAgICAgICBfX19fcmVuZGVyRm4uY2FsbCh7fSwgc2NvcGUsIGN1clNvdXJjZTEsIG5ld1RhcmdldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc291cmNlLm5vZGVUeXBlID09PSAzKSB7XG4gICAgICAgICAgICB2YXIgX25ld19lbGVtID0gc291cmNlLmNsb25lTm9kZShmYWxzZSk7XG4gICAgICAgICAgICBfbmV3X2VsZW0udGV4dENvbnRlbnQgPSBmdW5jLl9fZXZhbF9fLmNhbGwoc2NvcGUsIHNjb3BlLCBfbmV3X2VsZW0udGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKF9uZXdfZWxlbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2lmICgpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJub3JtYWwgbm9kZVwiLCBzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoc291cmNlLmNsb25lTm9kZShmYWxzZSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBAdG9kbyBjaGVjayBpZiBpdCBpcyBhIHRlbXBsYXRlIG5vZGUgYW5kIHVzZSBjb250ZW50RWxlbWVudHNcblxuICAgIC8vIFdhbGsgYWxsIGNoaWxkc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGN1clNvdXJjZSA9IHNvdXJjZS5jaGlsZE5vZGVzW2ldO1xuICAgICAgICAvLyBSZW5kZXIgY29udGVudCBub2RlcyBpbnRvIHByZXZpb3VzIHRhcmdldC5cbiAgICAgICAgX19fX3JlbmRlckZuLmNhbGwoe30sIHNjb3BlLCBjdXJTb3VyY2UsIHRhcmdldCk7XG4gICAgfVxufSIsIlxuY2xhc3MgVHBsTm9kZSB7XG5cbn1cblxuXG5cblxuXG5cbmZ1bmN0aW9uIF9fY29tcGlsZWRfdHBseChzY29wZSwgX2N1cl9ub2RlKSB7XG4gICAgZm9yICh2YXIgd3Vyc3QgaW4gc2NvcGUuYSkge1xuICAgICAgICBfY3VyX25vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSlcbiAgICB9XG59XG5cblxuXG5jbGFzcyBUcGxDb21waWxlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hdHRycyA9IHtcbiAgICAgICAgICAgIFwiZm9yJFwiOiBmdW5jdGlvbiAodHBsTm9kZSkge1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgY29tcGlsZShub2RlKSB7XG4gICAgICAgIHZhciB3dXJzdCA9IFwibXVoXCJcblxuXG5cbiAgICAgICAgbm9kZS5nZXRBdHRyaWJcblxuXG4gICAgfVxuXG5cbn0iLCJcbmNsYXNzIENKQWpheEZvcm1FbGVtZW50IGV4dGVuZHMgQ0pGb3JtRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYWpheEFjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMucHJlbG9hZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG51bGw7XG4gICAgfVxuXG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFqYXgtYWN0aW9uXCIsIFwicHJlbG9hZFwiLCBcIm9uc3VjY2Vzc1wiLCAuLi5DSkZvcm1FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc107IH1cblxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwiYWpheC1hY3Rpb25cIjpcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJwcmVsb2FkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJvbnN1Y2Nlc3NcIjpcbiAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2VzcyA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIF9vbl9zdWJtaXRfY2xpY2soZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcImxvYWRpbmdcIik7XG5cbiAgICAgICAgbGV0IGZvcm1EYXRhID0ge307XG4gICAgICAgIHRoaXMuX2Zvcm1FbGVtZW50cyA9ICQoXCJpbnB1dCwgdGV4dGFyZWEsIGNoZWNrYm94XCIsIHRoaXMpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMuZWFjaCgoaSwgZSkgPT4gdGhpcy5fZ2F0aGVyX2Zvcm1fZGF0YShlLCBmb3JtRGF0YSkpO1xuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudHMucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuICAgICAgICBsZXQgYWpheE9wdGlvbnMgPSBDb21wQ29yZS5pbnN0YW5jZS5hamF4T3B0aW9ucztcbiAgICAgICAgYWpheE9wdGlvbnNbXCJtZXRob2RcIl0gPSBcInBvc3RcIjtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJ1cmxcIl0gPSB0aGlzLmFqYXhBY3Rpb247XG4gICAgICAgIGFqYXhPcHRpb25zW1wiZGF0YVwiXSA9IEpTT04uc3RyaW5naWZ5KGZvcm1EYXRhKTtcbiAgICAgICAgYWpheE9wdGlvbnNbXCJjb250ZW50VHlwZVwiXSA9IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiO1xuICAgICAgICBhamF4T3B0aW9uc1tcImRhdGFUeXBlXCJdID0gXCJqc29uXCI7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBqUXVlcnkuYWpheChhamF4T3B0aW9ucykuZG9uZShcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy9zZWxmLl9zdWJtaXRCdXR0b24ucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoXCJsb2FkaW5nXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3N1Ym1pdEJ1dHRvbi5hZGRDbGFzcyhcInNhdmVkXCIpO1xuICAgICAgICAgICAgICAgIC8vc2VsZi5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub25zdWNjZXNzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gZXZhbChzZWxmLm9uc3VjY2Vzcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgciA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcih0aGlzLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9zdWJtaXRCdXR0b24gPSAkKFwiYnV0dG9uW3R5cGU9J3N1Ym1pdCddLCBpbnB1dFt0eXBlPSdzdWJtaXQnXVwiLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fc3VibWl0QnV0dG9uLmNsaWNrKGUgPT4gdGhpcy5fb25fc3VibWl0X2NsaWNrKGUpKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzID0gJChcImlucHV0LCB0ZXh0YXJlYSwgY2hlY2tib3hcIiwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJlbG9hZCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnRzLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGpRdWVyeS5hamF4KHRoaXMuYWpheEFjdGlvbiwgQ29tcENvcmUuaW5zdGFuY2UuYWpheE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9maWxsX2RhdGEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Zvcm1FbGVtZW50cy5wcm9wKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNqLWFqYXgtZm9ybVwiLCBDSkFqYXhGb3JtRWxlbWVudCk7IiwiXG5cbmNsYXNzIENqU2NyaXB0RWxlbWVudCBleHRlbmRzIENKSHRtbEVsZW1lbnQge1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8qIHNldFRpbWVvdXQoKTogbWFrZSBpdCB3b3JrIG9uIGNocm9tZSBhbmQgb3BlcmEgdG8gc3VwcG9ydCBkeW5hbWljIGluc3RhbmNpYXRpb24gLSBvdGhlcndpc2UgY2hpbGRFbGVtZW50cyB3aWxsIGJlIGVtcHR5Ki9cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IHNlbGYuaW5uZXJUZXh0O1xuICAgICAgICAgICAgc2VsZi50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImV2YWxcIiwgY29udGVudCk7XG4gICAgICAgICAgICBldmFsKGNvbnRlbnQpO1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xuICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICAgICAgICAgIHNlbGYuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG5cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwiY2otc2NyaXB0XCIsIENqU2NyaXB0RWxlbWVudCk7Il19