var paramDefaults = new Map([
	["int", "i"],
	["float", "f"],
	["double", "d"],
	["boolean", "b"],
	["String", "s"],
	["BlockPos", "pos"],
	["ItemStack", "stack"],
	["MatrixStack", "matrices"]
]);
var latestVersionBuilds = new Map();
var classes = new Map();
var methods = [];
var properSignature = "";

fetch("https://maven.fabricmc.net/net/fabricmc/yarn/maven-metadata.xml")
	.then(response => response.text())
	.then(text => {
		var xml = new DOMParser().parseFromString(text, "text/xml");
		var versions = [];
		for (const tag of xml.getElementsByTagName("versions")[0].getElementsByTagName("version")) {
			var t = tag.innerHTML.toLowerCase();
			var m = t.match(/^(\d+\.\d+(\.\d+)?)\+build\.(\d+)$/);
			if (m) {
				var build = parseInt(m[3]);
				t = m[1];
				if (!latestVersionBuilds.has(t)) {
					versions.push(t);
				}
				latestVersionBuilds.set(t, build);
			} else if (t.match(/\d\dw/) || t.includes("pre") || t.includes("rc") || t.includes("experimental") || t.includes("combat") || t.includes("3d")) {
				// Ignore
			} else {
				console.log("Unrecognized version format found: " + t);
			}
		}
		var options = "";
		for (const version of versions) {
			options = `<option value="${version}">${version}</option>` + options;
		}
		document.getElementById("version").innerHTML = options;
		pickVersion(versions[versions.length - 1]);
	});

function loadVersion(version, build) {
	fetch(`https://maven.fabricmc.net/net/fabricmc/yarn/${version}%2Bbuild.${build}/yarn-${version}%2Bbuild.${build}-tiny.gz`)
		.then(response => response.blob())
		.then(blob => parseGzip(blob))
		.then(text => {
			initTiny(text);
		});
}

async function parseGzip(blob) {
	var stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
	var chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	return new TextDecoder().decode(new Uint8Array(await new Blob(chunks).arrayBuffer()));
}

function initTiny(tiny) {
	classes.clear();
	methods.length = 0;
	var lines = tiny.split('\n');
	for (var i = 0; i < lines.length; i++) {
		var parts = lines[i].split('\t');
		if (parts[0] == "CLASS") {
			classes.set(parts[1], "L" + parts[3] + ";");
		} else if (parts[0] == "METHOD") {
			methods.push(lines[i]);
		}
	}
	generateMethod();
}

function inputKey(event) {
	console.log(event);
	if (event.keyCode == 13) {
		if (event.shiftKey) {
			generateMethod();
		} else {
			submitValue();
		}
	}
}

function pickVersion(event) {
	document.getElementById("method").innerHTML = "";
	var version = document.getElementById("version").value;
	loadVersion(version, latestVersionBuilds.get(version));
}

function submitValue() {
	var input = document.getElementById("response");
	var output = document.getElementById("corrections");
	var value = input.value;
	if (value.length == 0) {
		value = " ";
	}
	var valueParts = compareSplit(value);
	var properParts = compareSplit(properSignature);
	var ret = "<table cellspacing='0' cellpadding='0'><tr>";
	for (var i = 0; i < valueParts.length; i++) {
		if (i < properParts.length && properParts[i] == valueParts[i]) {
			ret += "<td><div class='right'>" + valueParts[i] + "</div></td>";
		} else {
			ret += "<td><div class='wrong'>" + valueParts[i] + "</div></td>";
		}
	}
	for (var i = valueParts.length; i < properParts.length; i++) {
		ret += "<td><div class='wrong'> </div></td>";
	}
	ret += "</tr><tr>";
	for (var i = 0; i < properParts.length; i++) {
		ret += "<td>" + properParts[i] + "</td>";
	}
	ret += "</tr></table>";
	output.innerHTML = ret;
	input.value = "";
}

function compareSplit(s) {
	var ret = [];
	var start = 0;
	console.log(s);
	for (var i = 0; i < s.length; i++) {
		if (s[i] == ";") {
			ret.push(s.substring(start, i + 1));
			start = i + 1;
		} else if (s[i] == "." || s[i] == ")" || s[i] == "(") {
			if (start != i) {
				ret.push(s.substring(start, i));
			}
			ret.push(s[i]);
			start = i + 1;
		}
	}
	ret.push(s.substring(start, s.length));
	return ret;
}

function generateMethod() {
	document.getElementById("corrections").innerHTML = "\n\n";
	var package = "L" + document.getElementById("package").value;
	var allowUnmapped = document.getElementById("allow_unmapped").checked;
	for (var v = 0; v < 1000; v++) {
		var method = methods[Math.floor(Math.random() * methods.length)];
		var parts = method.split('\t');
		if (parts[4] == parts[5] && !allowUnmapped) {
			continue;
		}
		var rawClazz = classes.get(parts[1]);
		if (rawClazz == undefined) {
			if (allowUnmapped) {
				continue;
			}
			rawClazz = parts[1];
		}
		var clazz = getTypeName(rawClazz);
		if (!rawClazz.startsWith(package)) {
			continue;
		}
		var sigParts = parts[2].split(')');
		var params = getParams(sigParts[0].substring(1));
		var paramNames = getParamNames(clazz, params);
	
		var disp = "<span class='keyword'>public</span> <span class='type'>void</span> <span class='func'>func</span>(<span class='type'>"
			+ clazz + "</span> <span class='var'>" + paramNames[0] + "</span>";
		for (var i = 0; i < params.length; i++) {
			disp += ", <span class='type'>" + params[i] + "</span> <span class='var'>" + paramNames[i + 1] + "</span>";
		}
		disp += ") {\n\t";
		if (sigParts[1] != "V") {
			disp += "<span class='type'>" + getTypeName(sigParts[1], true, true) + "</span> <span class='var'>ret</span> = ";
		}
		disp += "<span class='var'>" + paramNames[0] + "</span>.<span class='func'>" + parts[5] + "</span>(";
		for (var i = 0; i < params.length; i++) {
			if (i != 0) {
				disp += ", ";
			}
			disp += "<span class='var'>" + paramNames[i + 1] + "</span>";
		}
		disp += ");\n}";
	
		document.getElementById("method").innerHTML = disp;
		properSignature = rawClazz.substring(1, rawClazz.length - 1) + "." + parts[5] + remapSignature(parts[2]);
	}
}

function getParamNames(base, params) {
	var ret = [getParamNameBase(base)];
	for (var i = 0; i < params.length; i++) {
		ret.push(getParamNameBase(params[i]) + (i + 1));
	}
	return ret;
}

function getParamNameBase(c) {
	var postfix = "";
	if (c.includes("[")) {
		postfix = "Arr";
	}
	c = c.replace(/\[|\]/g, "");
	var def = paramDefaults.get(c);
	if (def != undefined) {
		return def + postfix;
	}
	var parts = c.split(".");
	c = parts[parts.length - 1];
	return c.substring(0, 1).toLowerCase() + c.substring(1) + postfix; 
}

function getParams(signature) {
	var ret = [];
	var array = 0;
	signature = remapSignature(signature);
	for (var i = 0; i < signature.length; i++) {
		if (signature[i] == "[") {
			array++;
		} else if (signature[i] == "L") {
			var start = i;
			while (signature[i] != ";") {
				i++;
			}
			var raw = signature.substring(start, i + 1);
			var mapped = classes.get(raw.substring(1, raw.length - 1));
			if (mapped != undefined) {
				raw = mapped;
			}
			ret.push(getTypeName(raw) + "[]".repeat(array));
			array = 0;
		} else {
			ret.push(getTypeName(signature[i]) + "[]".repeat(array));
			array = 0;
		}
	}
	return ret;
}

function remapSignature(signature) {
	var ret = "";
	for (var i = 0; i < signature.length; i++) {
		if (signature[i] == "L") {
			var start = i;
			while (signature[i] != ";") {
				i++;
			}
			var raw = signature.substring(start, i + 1);
			var mapped = classes.get(raw.substring(1, raw.length - 1));
			if (mapped != undefined) {
				raw = mapped;
			}
			ret += raw;
		} else {
			ret += signature[i];
		}
	}
	return ret;
}

function getTypeName(raw, remap = false, arrays = false) {
	var arrCount = 0;
	if (arrays) {
		while (raw.length > 0) {
			if (raw[0] == '[') {
				arrCount++;
				raw = raw.substring(1);
			} else {
				break;
			}
		}
	}
	var arrEnd = "[]".repeat(arrCount);
	if (raw == "F") {
		return "float" + arrEnd;
	} else if (raw == "I") {
		return "int" + arrEnd;
	} else if (raw == "Z") {
		return "boolean" + arrEnd;
	} else if (raw == "D") {
		return "double" + arrEnd;
	} else if (raw == "B") {
		return "byte" + arrEnd;
	} else if (raw == "C") {
		return "char" + arrEnd;
	} else if (raw == "S") {
		return "short" + arrEnd;
	} else if (raw == "J") {
		return "long" + arrEnd;
	} else if (raw.startsWith("L")) {
		if (remap) {
			var mapped = classes.get(raw.substring(1, raw.length - 1));
			if (mapped != undefined) {
				raw = mapped;
			}
		}
		var parts = raw.split('/');
		var name = parts[parts.length - 1];
		if (parts.length == 0) {
			name = name.substring(1);
		}
		return name.substring(0, name.length - 1).replace("$", ".") + arrEnd;
	}
	return "?" + arrEnd;
}