
class QueryExpansionPanel extends HTMLElement {
    static observedAttributes = ['include','exclude','server'];

    constructor() {
        super();
        this.include = [];
        this.exclude = [];
        this.modules = [];
        this.response = null;
    }

    connectedCallback() {
        const xhttp = new XMLHttpRequest();
        xhttp.state = this;
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                this.state.render("initialising...");
                this.state.modules = JSON.parse(this.responseText);
                this.state.update();
            }
        }
        xhttp.open("GET", this.server + "/modules", true);
        xhttp.send();
    }

    expand(querystring) {
        const xhttp = new XMLHttpRequest();
        xhttp.state = this;
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                this.state.render("expanding...");
                this.state.response = JSON.parse(this.responseText);
                console.log(this.state.response);
                this.state.update();
            }
        }
        xhttp.open("GET", encodeURI(this.server + "/?q=" + querystring), true);
        xhttp.send();
    }

    update() {
        var s = "<h4>Modules</h4> <ul class=\"modules\">";
        this.modules.forEach(module => {
            if ((this.include.length === 0 || this.include.includes(module.id)) &&
                (this.exclude.length === 0 || !this.exclude.includes(module.id))) {
                s += "<li>" + module_header(module, true) + "</li>";
            }
        });
        s += "</ul>";
        if (this.response !== null) {
            s += "<h4>Term Expansions</h4>";
            var termindex = 0;
            for (const [term, sources] of Object.entries(this.response.terms)) {
                s += "<ol class=\"terms\">";
                s += "<li><span>" + term + "</span>";
                s += "<ul class=\"sources\">";
                var expansionindex = 0;
                sources.forEach(source => {
                    s += "<li><span>" + source.source_name + "</span>";
                    s += "<ul class=\"expansions\">";
                    source.expansions.forEach(expansion => {
                        var id="term" + termindex + "." + expansionindex;
                        var attribs = " checked=\"checked\"";
                        s += "<li> <input type=\"checkbox\" name=\"" + id + "\" id=\"" + id + "\" value=\"" + expansion + "\"" + attribs + "> <label for=\"" + id + "\">" + expansion + "</label></li>";
                        expansionindex += 1;
                    });
                    s += "</ul></li>";
                });
                s += "</ul>";
                s += "</li>";
                s += "</ol>";
                termindex += 1;
            };
        }
        this.render(s);
    }

    render(s) {
        this.innerHTML = "<div class=\"kweepeer\">" + s + "</div>";
    }


    attributeChangedCallback() {
        this.update();
    }

    get server() {
        return this.getAttribute('server');
    }

    set server(value) {
        if (this.getAttribute('server') !== value) {
            this.setAttribute('server',value);
        }
    }

    get include() {
        return this.getAttribute('include');
    }

    set include(value) {
        if (Array.isArray(value)) {
            this.setAttribute('include',value);
        } else if (typeof value === "string") {
            this.setAttribute('include',value.split(","));
        }
    }

    get exclude() {
        return this.getAttribute('exclude');
    }

    set exclude(value) {
        if (Array.isArray(value)) {
            this.setAttribute('exclude',value);
        } else if (typeof value === "string") {
            this.setAttribute('exclude',value.split(","));
        }
    }
}

export const registerKweepeerComponent = () => {
    customElements.define('kweepeer-panel', QueryExpansionPanel);
}

function module_header(module, checked) {
    var attribs = "";
    if (checked === true) {
        attribs = " checked=\"checked\"";
    }
    return "<input type=\"checkbox\" id=\"kweepeer-module-" + module.id + "\"" + attribs + "> <label>" + module.name + "</label> <span class=\"type\">(" + module.type + ")</span>";
}

