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
var classes = new Map();
var methods = [];
var properSignature = "";

fetch("./yarn.tiny")
	.then(response => response.text())
	.then(text => {
		var lines = text.split('\n');
		for (var i = 0; i < lines.length; i++) {
			var parts = lines[i].split('\t');
			if (parts[0] == "CLASS") {
				classes.set(parts[1], "L" + parts[3] + ";");
			} else if (parts[0] == "METHOD") {
				methods.push(lines[i]);
			}
		}
		generateMethod();
	});

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
	//if (properSignature == value) {
	//	output.innerHTML = properSignature + "\n<div class='right'>" + value + "</div>";
	//} else {
	//	output.innerHTML = properSignature + "\n<div class='wrong'>" + value + "</div>";
	//}
	output.innerHTML = ret;
	input.value = "";
}

function compareSplit(s) {
	var ret = [];
	var start = 0;
	for (var i = 0; i < s.length; i++) {
		if (s[i] == ";" || s[i] == "." || s[i] == ")" || s[i] == "(") {
			ret.push(s.substring(start, i + 1));
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
	
		var disp = "<span class='keyword'>void</span> <span class='func'>func</span>(<span class='type'>"
			+ clazz + "</span> <span class='var'>" + paramNames[0] + "</span>";
		for (var i = 0; i < params.length; i++) {
			disp += ", <span class='type'>" + params[i] + "</span> <span class='var'>" + paramNames[i + 1] + "</span>";
		}
		disp += ") {\n\t";
		if (sigParts[1] != "V") {
			disp += "<span class='type'>" + getTypeName(sigParts[1], true) + "</span> <span class='var'>ret</span> = ";
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
	var def = paramDefaults.get(c);
	if (def != undefined) {
		return def;
	}
	var parts = c.split(".");
	c = parts[parts.length - 1];
	return c.substring(0, 1).toLowerCase() + c.substring(1); 
}

function getParams(signature) {
	var ret = [];
	signature = remapSignature(signature);
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
			ret.push(getTypeName(raw));
		} else {
			ret.push(getTypeName(signature[i]));
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

function getTypeName(raw, remap = false) {
	if (raw == "F") {
		return "float";
	} else if (raw == "I") {
		return "int";
	} else if (raw == "Z") {
		return "boolean";
	} else if (raw == "D") {
		return "double";
	} else if (raw == "B") {
		return "byte";
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
		return name.substring(0, name.length - 1).replace("$", ".");
	}
	return "?";
}