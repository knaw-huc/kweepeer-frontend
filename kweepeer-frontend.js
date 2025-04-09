
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
        var s = "<h4>Modules</h4>\n<ul class=\"modules\">\n";
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
                        var id="term" + termindex + "-" + expansionindex;
                        var attribs = ' checked="checked"';
                        s2 += `<li> <input type="checkbox" name="${id}" id="${id}" value="${expansion}" ${attribs}> <label for="${id}">${expansion}</label></li>\n`;
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
        this.render(s);


        // implements select all / none buttons
        document.querySelectorAll(".selectall").forEach((element) => {
            element.onclick = selectall;
        });
        document.querySelectorAll(".selectnone").forEach((element) => {
            element.onclick = selectnone;
        });
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
    console.log(`DEBUG selectall: ${target.dataset.termIndex} ${target.dataset.beginterm} ${target.dataset.endterm}`);
    for (var i = target.dataset.beginterm; i < target.dataset.endterm; i++) {
        var e = document.getElementById(`term${target.dataset.termIndex}-${i}`);
        e.checked = true;
    }
}

function selectnone(event) {
    var target = event.target;
    console.log(`DEBUG selectnone: ${target.dataset.termIndex} ${target.dataset.beginterm} ${target.dataset.endterm}`);
    for (var i = target.dataset.beginterm; i < target.dataset.endterm; i++) {
        var e = document.getElementById(`term${target.dataset.termIndex}-${i}`);
        e.checked = false;
    }
}
