
class QueryExpansionPanel extends HTMLElement {
    static observedAttributes = ['include','exclude','server', 'textannoviz'];

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
        var querybutton = (this.textannoviz !== undefined && this.response !== null) ? '<button id="kweepeer-query">Run query</button>\n': "";
        var s = querybutton + "<h4>Modules</h4>\n<ul class=\"modules\">\n";
        this.modules.forEach(module => {
            if ((this.include.length === 0 || this.include.includes(module.id)) &&
                (this.exclude.length === 0 || !this.exclude.includes(module.id))) {
                s += "<li>" + module_header(module, true) + "</li>\n";
            }
        });
        s += "</ul>\n";
        if (this.response !== null) {
            s += "<h4>Term Expansions</h4>\n";
            var termindex = 0;
            for (const [term, sources] of Object.entries(this.response.terms)) {
                s += `<ol class="terms">
                         <li><span>${term}</span>
                         <ul class="sources">
                `;
                var expansionindex = 0;
                sources.forEach(source => {
                    var s2 = "";
                    var beginindex = expansionindex;
                    source.expansions.forEach(expansion => {
                        var termid="term" + termindex + "-" + expansionindex;
                        var attribs = ' checked="checked"';
                        s2 += `<li> <input type="checkbox" name="${termid}" id="${termid}" value="${expansion}" ${attribs}> <label for="${termid}">${expansion}</label></li>\n`;
                        expansionindex++;
                    });
                    s += `      <li><label>${source.source_name}</label>
                                    <button data-source-id="${source.source_id}" data-term-index="${termindex}" data-beginterm="${beginindex}" data-endterm="${expansionindex}" class="selectall">+</button> 
                                    <button data-source-id="${source.source_id}" data-term-index="${termindex}" data-beginterm="${beginindex}" data-endterm="${expansionindex}" class="selectnone">-</button> 
                                    <ul class="expansions">
                                    ${s2}
                                    </ul>
                                </li>
                    `;
                });
                s += "    </ul>\n";
                s += "  </li>\n";
                s += "</ol>\n";
                termindex++;
            };
        }
        if (this.textannoviz !== undefined && this.response !== null) {
            s += `<button onclick="document.getElementById('kweepeer-query').click();">Run query</button>`;
        }
        this.render(s);


        // associates events with select all / none buttons
        document.querySelectorAll(".selectall").forEach((element) => {
            element.onclick = selectall;
        });
        document.querySelectorAll(".selectnone").forEach((element) => {
            element.onclick = selectnone;
        });

        if (this.response !== null && this.textannoviz !== undefined) {
            document.getElementById("kweepeer-query").onclick = (event) => {
                query(this);
            }
        }
    }

    render(s) {
        this.innerHTML = "<div class=\"kweepeer\">\n" + s + "\n</div>\n";
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

    get textannoviz() {
        return this.getAttribute('textannoviz');
    }

    set textannoviz(value) {
        if (this.getAttribute('textannoviz') !== value) {
            this.setAttribute('textannoviz',value);
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
    return `<input type="checkbox" id="kweepeer-module-${module.id}" ${attribs}> <label>${module.name}</label> <span class="type">(${module.type})</span>`;
}


function selectall(event) {
    var target = event.target;
    for (var i = target.dataset.beginterm; i < target.dataset.endterm; i++) {
        var e = document.getElementById(`term${target.dataset.termIndex}-${i}`);
        e.checked = true;
    }
}

function selectnone(event) {
    var target = event.target;
    for (var i = target.dataset.beginterm; i < target.dataset.endterm; i++) {
        var e = document.getElementById(`term${target.dataset.termIndex}-${i}`);
        e.checked = false;
    }
}

function query(state) {
    var query = state.response.query_expansion_template;
    var termindex = 0;
    for (const [term, sources] of Object.entries(state.response.terms)) {
        var expansions = new Set();
        var expansionindex = 0;
        sources.forEach(source => {
            source.expansions.forEach(expansion => {
                var termid="term" + termindex + "-" + expansionindex;
                if (document.getElementById(termid).checked) {
                    expansions.add(expansion);
                }
                expansionindex++;
            });
        });
        if (expansions.length === 0) {
            //no expansions selected, just maintain the term itself
            query = query.replaceAll("{{" + term + "}}", '"' + term + '"');
        } else {
            var disjunction = '"' + term + '"';
            for (const expansion of expansions) {
                disjunction += " OR " + "\"" + expansion + "\""; //TODO: validation
            }
            if (expansions.length >= 1) {
                query = query.replaceAll("{{" + term + "}}", "(" + disjunction + ")");
            } else {
                query = query.replaceAll("{{" + term + "}}", disjunction);
            }
        }
    }
    console.log("[kweeper] expanded query = " + query); 
    window.location.assign(state.textannoviz + "/?query[fullText]=" + query);
}
