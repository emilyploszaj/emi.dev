const FLOWCHART_FORM = {
	types: {
		node: {
			type: "object",
			fields: {
				name: {
					display: "Name",
					type: "string",
					initializer: (path) => String.fromCharCode(97 + (parseInt(path.split(".")[0])))
				},
				type: {
					display: "Type",
					type: "string"
				},
				content: {
					display: "Content",
					type: "string"
				},
				connections: {
					display: "Connections",
					type: "list",
					of: "connection"
				}
			}
		},
		connection: {
			type: "object",
			fields: {
				to: {
					display: "To",
					type: "string"
				},
				content: {
					display: "Content",
					type: "string"
				}
			}
		}
	},
	root: {
		display: "Flowchart",
		type: "list",
		of: "node"
	},
	extract: (v) => rekeyArray(v, "name"),
	onupdate: (v) => document.getElementById("flowchart-output").value = JSON.stringify(v),
}

var activeForms = new Map();

function debugForm() {
	document.getElementById("full-page").innerHTML = `
		${new TemplateForm("flowchart", FLOWCHART_FORM).compose()}
		<textarea id="flowchart-output"></textarea>
	`
}

function addFormElement(id, path) {
	activeForms.get(id).addListElement(path);
}

function updateForm(id) {
	activeForms.get(id).update();
}

class TemplateForm {
	source;
	types;
	listAdds = new Map();

	constructor(id, obj) {
		this.id = id;
		this.types = obj.types;
		this.source = obj;
		activeForms.set(id, this);
	}

	update() {
		if (this.source.onupdate) {
			this.source.onupdate(this.extract());
		}
	}

	extract() {
		var el = document.getElementById(`form-${this.id}`);
		var ret = this.extractObject(el).root;
		if (this.source.extract) {
			return this.source.extract(ret);
		}
		return ret;
	}

	extractChild(el) {
		if (el.classList.contains("form-object")) {
			return this.extractObject(el);
		} else if (el.classList.contains("form-list")) {
			return this.extractList(el);
		} else if (el.classList.contains("form-string")) {
			return this.extractString(el);
		}
		return undefined;
	}

	/**
	 * @param {HTMLElement} el 
	 */
	extractObject(el) {
		var obj = {};
		for (const c of el.children) {
			var key = c.getAttribute("form-key");
			if (key) {
				var extracted = this.extractList(c)[0];
				obj[key] = extracted;
			}
		}
		return obj;
	}

	/**
	 * @param {HTMLElement} el 
	 */
	extractList(el) {
		var list = [];
		for (const c of el.children) {
			var extracted = this.extractChild(c);
			if (extracted != undefined) {
				list.push(extracted);
			}
		}
		return list;
	}

	/**
	 * @param {HTMLElement} el 
	 */
	extractString(el) {
		return el.value ?? "";
	}

	compose() {
		return `
		<div class="form-holder" id="form-${this.id}">
			<div class="form-key" form-key="root">
				${this.composeFormChild("", this.source.root)}
			</div
		</div>`;
	}

	composeFormChild(path, obj) {
		if (obj.type == "object") {
			return this.composeFormObject(path, obj);
		} else if (obj.type == "list") {
			return this.composeFormList(path, obj);
		} else if (obj.type == "string") {
			return this.composeFormString(path, obj);
		} else if (this.types[obj.type]) {
			return this.composeFormChild(path, this.types[obj.type]);
		}
	}

	composeFormObject(path, obj) {
		var output = "";
		for (const k of Object.keys(obj.fields)) {
			output += `
			<div class="form-key" form-key="${k}">
				${this.composeFormChild(this.subpath(path, k), obj.fields[k])}
			</div>`;
		}
		return `
		<div id="${this.getId(path)}" class="form-element form-object">
			${output}
		</div>`;
	}

	composeFormList(path, obj) {
		this.listAdds.set(path, (index) => {
			var child = Object.assign({}, obj)
			child.type = obj.of;
			return this.composeFormChild(this.subpath(path, "" + index), child)
		});
		var child = Object.assign({}, obj)
		child.type = obj.of;
		return `
		<div id="${this.getId(path)}" class="form-element form-list">
			<div class="form-title">${obj.display}</div>
			${this.listAdds.get(path)(0)}
			<button onclick="addFormElement('${this.id}', '${path}')" class="form-add">Add...</button>
		</div>`;
	}

	addListElement(path) {
		var list = document.getElementById(`form-${this.id}:${path}`);
		var addButton = list.children[list.children.length - 1];
		addButton.outerHTML = `
			${this.listAdds.get(path)(list.children.length - 2)}
		` + addButton.outerHTML;
	}

	composeFormString(path, obj) {
		var value = "";
		if (obj.initializer) {
			value = obj.initializer(path);
		}
		return `<label>${obj.display}</label><input oninput="updateForm('${this.id}')" id="${this.getId(path)}" class="form-string" type="text" value="${value}"></input><br/>`;
	}

	getId(path) {
		return `form-${this.id}:${path}`;
	}

	subpath(path, child) {
		if (path.length == 0) {
			return child;
		}
		return path + "." + child;
	}
}
