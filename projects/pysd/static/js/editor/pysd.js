// Copyright (c) Dylan Beswick 2016
// pysd: A Python, Ruby and ActionScript based language that compiles to scratch: https://scratch.mit.edu

// ########### Make data objects ###########

pysd = new Object();
pysd.INIT = new Object();
pysd.INIT_DATA = new Object();
pysd.EDITOR = new Object();
pysd.EDITOR_DATA = new Object();
pysd.CALLBACKS = new Object();
pysd.DYNAMIC_CALLBACKS = new Object();
pysd.CONTEXT_MENU_CALLBACKS = new Object();
pysd.REQUESTS = new Object();
pysd.SPECS = new Object();
pysd.STATIC = new Object();
pysd.PARSER = new Object();
pysd.PARSER.LEXER = new Object();
pysd.PARSER.PARSER = new Object();
pysd.EXCEPTIONS = new Object();
pysd.TOOLS = new Object();
pysd.SYNTAX_HIGHLIGHTING = new Object();

// ########### Constants ###########

pysd.VERSION = "1.0";



// ########### Template Data ###########

pysd.INIT_DATA.modal_popups = [
	{
		"name": "context_menu_error",
		"message": "An error occurred during that operation. If the problem persists, please try refreshing the page.",
		"type": "error"
	},
	{
		"name": "specs_not_loaded_error",
		"message": "Could not load the specs. Please check your internet connection and refresh the page.",
		"type": "error"
	}
]

pysd.INIT_DATA.context_menus = [
	{
		"name": "File",
		"options": [
			["New", "create_new_file"],
			["Save", "save_pysd_file"],
			["Open", "load_pysd_file"],
			["_divider"],
			["Check Code", "try_parse_code"],
			["_divider"],			
			["Compile SB2", "compile_sb2_file"],
			["Open SB2", "load_sb2_file"],
			["_divider"],	
			["Exit", "quit"],
		]
	},
	{
		"name": "Edit",
		"options": [
			["Undo",  "undo_change"],
			["Redo",  "redo_change"],
			["Copy",  "copy_text_selection"],
			["Cut",   "cut_text_selection"],
			["Paste", "paste_clipboard"],
		]
	},	
	{
		"name": "Tools",
		"options": [
			["Help...", "show_help"],			
			["_divider"],
			["Syntax Highlighting", "show_syntax_highlighting_options"],
			["Preferences", "show_options"],
			["_divider"],
			["_text", "Version " + pysd.VERSION],
		]
	},	
]

// -------------------------------------------------------------------------------------------------------------

// ########### Context Menu Functions ###########

pysd.CONTEXT_MENU_CALLBACKS.quit = function() {
	window.close();
}



// ########### Callbacks ###########

pysd.CALLBACKS.specs_ready_callback = function(data, status) {
	pysd.EDITOR.set_status_text("Mounting Specs...");
	pysd.SPECS.CATEGORIES = data['categories'];
	pysd.SPECS.BLOCKS = data['functions'];
	pysd.EDITOR.set_status_text("Ready.");
}

pysd.CALLBACKS.specs_request_error = function(status) {
	pysd.EDITOR.show_cover();
	pysd.EDITOR.set_status_text("Error downloading specs. Please refresh the page to try again.");
	pysd.EDITOR.show_popup("specs_not_loaded_error");
}

pysd.CALLBACKS.resize = function() {
	document.getElementsByClassName('content')[0].style.height = (document.getElementsByClassName('editor')[0].clientHeight - document.getElementsByClassName('topbar')[0].clientHeight) - 80;
	document.getElementsByClassName('context-menu-popup')[0].style.width = document.getElementsByClassName('context-menubar')[0].clientWidth
}

pysd.CALLBACKS.on_load = function() {
	window.addEventListener("resize", pysd.EDITOR.update);
	document.fonts.ready.then(pysd.EDITOR.update)
	pysd.EDITOR.hide_cover();
	pysd.INIT.load_context_menus();
	pysd.INIT.load_popups();
	pysd.INIT.bind_ln();
	pysd.CALLBACKS.resize();
	
	pysd.EDITOR_DATA.alt_down = false
	
	pysd.EDITOR.set_status_text("Downloading block specs. Please Wait.");
	pysd.REQUESTS.GET("http://dx.dylan4.com/projects/pysd/static/specs/specs.pysd.json", pysd.CALLBACKS.specs_ready_callback, pysd.CALLBACKS.specs_request_error);
	
	var text_editors = document.getElementsByClassName('text-editor');
	for (var x = 0; x < text_editors.length; x++) {
		text_editors[x].spellcheck = false;
		text_editors[x].focus();
		text_editors[x].blur();		
	}
	
	pysd.EDITOR.update()
}

pysd.CALLBACKS.key_handler = function(kc) {
	var active_element = document.activeElement
	if (active_element.dataset.line != undefined) {
		var caret = pysd.EDITOR.get_caret()
		if (kc.keyCode === 13) {
			var d = document.createElement('tr');
			d.innerHTML = '<td class="line-number-container">1</td><td class="code-content"><div></div></td>'
			var ele = active_element.parentNode.parentNode.parentNode.insertBefore(d, active_element.parentNode.parentNode.nextSibling);
			pysd.CALLBACKS.rebind_editor_lines()
			pysd.EDITOR.set_caret(ele.children[1].children[0], 0)
		}
		else if (false) {}
		else if (false) {}
		else {
			setTimeout(function() {
				pysd.SYNTAX_HIGHLIGHTING.update_all();
				pysd.EDITOR.set_caret_by_index(active_element, caret + 1)}, 0)
		}
	}
}

pysd.CALLBACKS.key_down_handler = function(kc) {
	console.log(kc.keyCode)
	var active_element = document.activeElement
	if (active_element.dataset.line != undefined) {
		var caret = pysd.EDITOR.get_caret()
		if (kc.keyCode === 167) {
			console.log('invalid')
			kc.preventDefault()
		}
		if (kc.keyCode === 8) {
			setTimeout(function() {
				pysd.SYNTAX_HIGHLIGHTING.update_all();
				pysd.EDITOR.set_caret_by_index(active_element, caret - 1)}, 0)
		}
		if (kc.keyCode === 9) {
			kc.preventDefault()
			setTimeout(function() {
				var txt = pysd.TOOLS.text_node_subtree(active_element).join('')
				var newtxt = document.createTextNode((txt.slice(0, caret) + '§' + txt.slice(caret)) || '§')
				console.log("txt: '" + (txt.slice(0, caret) + txt.slice(caret)) + "'")
				active_element.innerHTML = ""
				active_element.appendChild(newtxt)
				pysd.SYNTAX_HIGHLIGHTING.update_all();
				console.log(caret)
				pysd.EDITOR.set_caret_by_index(active_element, caret + 1)}, 0)
		}
	}
}


pysd.CALLBACKS.rebind_editor_lines = function() {
	pysd.STATIC.line_numbering_content = []
	var lines = document.getElementsByClassName('code-content')
	var tedit = window.getComputedStyle(document.getElementsByClassName("text-editor")[0], null);
	for (var x = 0; x < lines.length; x++) {
		width = ((parseInt(tedit.width) - lines[x].parentElement.children[0].clientWidth) - 10) + "px"
		lines[x].parentElement.dataset.line = x + 1;
		lines[x].parentElement.children[0].innerHTML = x + 1
		lines[x].dataset.line = x + 1;
		lines[x].style.minWidth = width
		lines[x].style.maxWidth = width
		lines[x].children[0].contentEditable = true;
		lines[x].children[0].dataset.line = x + 1;
		lines[x].children[0].style.minWidth = width
		lines[x].children[0].style.maxWidth = width
		lines[x].children[0].removeEventListener('keydown', pysd.CALLBACKS.key_down_handler)
		lines[x].children[0].addEventListener('keydown', pysd.CALLBACKS.key_down_handler)
		lines[x].children[0].removeEventListener('keypress', pysd.CALLBACKS.key_handler)
		lines[x].children[0].addEventListener('keypress', pysd.CALLBACKS.key_handler)
		pysd.STATIC.line_numbering_content.push(lines[x])
	}
}

// ########### Initialization ###########

pysd.INIT.load_popups = function() {
	pysd.EDITOR_DATA.popups = {};
	for (var x = 0; x < pysd.INIT_DATA.modal_popups.length; x++) {
		var item = document.createElement("div");
		item.style.display = "none";
		item.className = "popup popup-" + pysd.INIT_DATA.modal_popups[x]["type"] + " popup--" + pysd.INIT_DATA.modal_popups[x]["name"];
		item.innerHTML = pysd.INIT_DATA.modal_popups[x]["message"];
		document.getElementsByClassName("modal-popups")[0].appendChild(item);
		pysd.EDITOR_DATA.popups[pysd.INIT_DATA.modal_popups[x]["name"]] = document.getElementsByClassName("popup--" + pysd.INIT_DATA.modal_popups[x]["name"])[0];
	}
}

pysd.INIT.load_context_menus = function() {
	pysd.EDITOR_DATA.context_menus = {};
	pysd.EDITOR_DATA.current_context_menu = null;
	pysd.DYNAMIC_CALLBACKS.context_menus = new Object()
	for (var x = 0; x < pysd.INIT_DATA.context_menus.length; x++) {
		pysd.EDITOR_DATA.context_menus[pysd.INIT_DATA.context_menus[x]["name"]] = new Function('', 'pysd.EDITOR.update(); if (pysd.EDITOR_DATA.current_context_menu === "' + pysd.INIT_DATA.context_menus[x]["name"] + '") {pysd.EDITOR.hide_menu()} else {pysd.EDITOR.show_menu("' + pysd.INIT_DATA.context_menus[x]["name"] + '")}')
		var item = document.createElement("a");
		item.className = "context-menu no-select context--" + pysd.INIT_DATA.context_menus[x]["name"]
		item.innerHTML = pysd.INIT_DATA.context_menus[x]["name"];
		item.onclick = pysd.EDITOR_DATA.context_menus[pysd.INIT_DATA.context_menus[x]["name"]]
		document.getElementsByClassName("context-menubar")[0].appendChild(item);
		pysd.EDITOR_DATA.context_menus[pysd.INIT_DATA.context_menus[x]["name"]] = document.getElementsByClassName("context--" + pysd.INIT_DATA.context_menus[x]["name"])[0];
	}
}

pysd.INIT.bind_ln = function() {
	pysd.STATIC.line_numbering_ref = document.getElementsByClassName('line-numbers');
	for (var x = 0; x < pysd.STATIC.line_numbering_ref.length; x++) {
		pysd.STATIC.line_numbering_ref[x].innerHTML = '<tr><td class="line-number-container">1</td><td class="code-content"><div></div></td></tr>';
	}
	pysd.CALLBACKS.rebind_editor_lines()
}
// ########### Editor Functions ###########

pysd.EDITOR.show_open_dialog = function() {
	document.getElementById('file-loader').click();
}

pysd.EDITOR.get_caret = function() {
	var caret = window.getSelection();
	if (caret.anchorNode.nodeType === 3) {
		var length = caret.anchorOffset
		var childNo = 0;
		var child = caret.anchorNode.parentElement;
		while ((child = child.previousSibling) != null) {
			if (child != null) {
				length += pysd.TOOLS.text_node_subtree(child).join('').length
			}
			childNo++;
		} 	
	}
	return length || 0
}

pysd.EDITOR.set_caret_by_index = function(elem, caret) {
	var child_indexes = [0]
	var children = []
	var index = 0
	for (var x = 0; x < (elem.children.length - 1); x++) {
		children.push(elem.children[x])
		index += pysd.TOOLS.text_node_subtree(elem.children[x]).join('').length
		child_indexes.push(index)
	}
	children.push(elem.children[x])
	var last_index = 0;
	var child;
	var child_index;
	for (var x = 0; x < (child_indexes.length); x++) {
		if (caret > child_indexes[x]) {
			child_index = caret - child_indexes[x]
			child = children[x]
		}
	}
	if ((child != undefined) | (child_index != undefined)) {
		pysd.EDITOR.set_caret(child, child_index)
	}
	else {
		pysd.EDITOR.set_caret(elem, 1)
	}
}


pysd.EDITOR.set_caret = function(elem, caretPos) {
    if (elem != null) {
		if (caretPos < 0) {
			caretPos = 0
		}
		var dels = false
		elem.focus();
		var range = document.createRange();
		try {
			range.setStart(elem.firstChild, caretPos);
		}
		catch(e) {
			dels = true
			elem.innerHTML = "&nbsp;"
			range.setStart(elem.firstChild, 0);
		}
		range.setEnd(elem.firstChild, caretPos);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		if (dels === true) {
			setTimeout(function() {elem.innerHTML = ""}, 0)
		}
    }
}

pysd.EDITOR.element_fade_in = function(elem, ms) {
	if (!elem) {
		return;
	}
	elem.style.opacity = 0;
	elem.style.filter = "alpha(opacity=0)";
	elem.style.display = "block";
	elem.style.visibility = "visible";
	if (ms) {
		var opacity = 0;
		var timer = setInterval(function() {
		  opacity += 10 / ms;
		  if (opacity >= 1) {
			  clearInterval(timer);
			  opacity = 1;
		  }
		  elem.style.opacity = opacity;
		  elem.style.filter = "alpha(opacity=" + opacity * 100 + ")";
		}, 10 );
	}
	else {
		elem.style.opacity = 1;
		elem.style.filter = "alpha(opacity=1)";
	}
}

pysd.EDITOR.element_fade_out = function(elem, ms) {
	if (!elem) {
		return;
	}
	if (ms) {
		var opacity = 1;
		var timer = setInterval(function() {
			opacity -= 10 / ms;
			if (opacity <= 0) {
				clearInterval(timer);
				opacity = 0;
				elem.style.display = "none";
				elem.style.visibility = "hidden";
			}
			elem.style.opacity = opacity;
			elem.style.filter = "alpha(opacity=" + opacity * 100 + ")";
		}, 10 );
	}
	else {
		elem.style.opacity = 0;
		elem.style.filter = "alpha(opacity=0)";
		elem.style.display = "none";
		elem.style.visibility = "hidden";
	}
}


pysd.EDITOR.hide_cover = function() {
	document.getElementsByClassName('modal-backdrop')[0].style.display = "none"
}

pysd.EDITOR.show_cover = function() {
	document.getElementsByClassName('modal-backdrop')[0].style.display = "block"
}

pysd.EDITOR.show_popup = function(popup) {
	var target = pysd.EDITOR_DATA.popups[popup];
	setTimeout(function() {
		pysd.EDITOR.element_fade_in(target, 400);
	}, 5);
	setTimeout(function() {
		pysd.EDITOR.element_fade_out(target, 400);
	}, 4500);
}

pysd.EDITOR.show_menu = function(name) {
	pysd.EDITOR_DATA.current_context_menu = name;
	var b = document.getElementsByClassName('context-menu-popup')[0]
	b.innerHTML = ""
	b.className = 'context-menu-popup no-select'
	for (var x = 0; x < pysd.INIT_DATA.context_menus.length; x++) {
		document.getElementsByClassName('context--' + pysd.INIT_DATA.context_menus[x]["name"])[0].style.backgroundColor = ""
		if (pysd.INIT_DATA.context_menus[x]["name"] === name) {
			document.getElementsByClassName('context--' + name)[0].style.backgroundColor = "#1F98D5"
			for (var y = 0; y < pysd.INIT_DATA.context_menus[x]["options"].length; y++) {
				var item = document.createElement("div");
				if (pysd.INIT_DATA.context_menus[x]["options"][y][0] === "_divider") {
					item.className = "context-menu-item-divider no-select"
				}
				else if (pysd.INIT_DATA.context_menus[x]["options"][y][0] === "_text") {
					item.className = "context-menu-item-text no-select"
					item.innerHTML = pysd.INIT_DATA.context_menus[x]["options"][y][1]
				}
				else {
					item.className = "context-menu-item no-select"
					item.onclick = new Function('', 'try {pysd.EDITOR.hide_menu(); pysd.CONTEXT_MENU_CALLBACKS.' + pysd.INIT_DATA.context_menus[x]["options"][y][1] + '()} catch(e) {pysd.EDITOR.show_popup("context_menu_error")}')
					item.innerHTML = pysd.INIT_DATA.context_menus[x]["options"][y][0]				
				}
				b.appendChild(item)
			}
		b.children[b.children.length - 1].className = b.children[b.children.length - 1].className + " context-menu-item-last"
		}
	}
}

pysd.EDITOR.hide_menu = function() {
	for (var x = 0; x < pysd.INIT_DATA.context_menus.length; x++) {
		document.getElementsByClassName('context--' + pysd.INIT_DATA.context_menus[x]["name"])[0].style.backgroundColor = ""
	}
	pysd.EDITOR_DATA.current_context_menu = null;
	var b = document.getElementsByClassName('context-menu-popup')[0]
	b.innerHTML = ""
	b.className = 'context-menu-popup no-select hidden'
}

pysd.EDITOR.get_code_line = function(ln) {
	return pysd.TOOLS.text_node_subtree(document.querySelector('tr[data-line="' + ln + '"] div[data-line="' + ln + '"]')).join("").replace(/\\n/g, "");
}

pysd.EDITOR.get_code = function() {
	code_lines = []
	for (var x = 0; x < document.getElementsByClassName('code-content').length; x++) {
		code_lines.push(pysd.EDITOR.get_code_line(x + 1))
	}
	return code_lines
}

pysd.EDITOR.set_status_text = function(status) {
	document.getElementsByClassName('status-bar')[0].innerHTML = status;
}

pysd.EDITOR.update = function() {
	pysd.CALLBACKS.resize();
	pysd.CALLBACKS.rebind_editor_lines();
}

// ########### Requests ###########

pysd.REQUESTS.GET = function(url, success, error) {
	var success = typeof success !== 'undefined' ? success : function() {};
	var error = typeof error !== 'undefined' ? error : function() {};
	var xhttp = new XMLHttpRequest();
	var complete = false;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4) {
			if (xhttp.status.toString()[0] == "2") {
				try {
					var res = JSON.parse(xhttp.responseText);
				}
				catch(e) {
					var res = xhttp.responseText;
				}
				success(res, xhttp.status);
			}
			else {
				error(xhttp.status);
			}
		}
	}
	xhttp.open("GET", url, true);
	xhttp.send();
}


// ########### Custom Errors ###########


pysd.EXCEPTIONS.ERROR = function(name) {
	name = 'pysd.' + name
	var func = new Function(name + " = function(message, line) {if (!(this instanceof " + name + ")) {return new " + name + "(message, line)}; this.message = message; this.line = line; this.stack = new Error(message).stack; this.toString = function() {return this.message}}; " + name + ".prototype = Object.create(Error.prototype)")();
}

// ########### Tools ###########

pysd.TOOLS.search = function(string, data) {
	var reg = new RegExp(data.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "g");
	return (string.search(reg) !== -1)
}

pysd.TOOLS.text_node_subtree = function(elem) {
	var txt = []
	for (var x = 0; x < elem.childNodes.length; x++) {
		if (elem.childNodes[x].nodeType === 3) {
			txt.push(elem.childNodes[x].nodeValue)
		}
		else {
			txt = txt.concat(pysd.TOOLS.text_node_subtree(elem.childNodes[x]))
		}
	}
	return txt
}

// ########### Syntax Highlighting ###########

pysd.SYNTAX_HIGHLIGHTING.TOKEN_MAP = { 
	"COM": "#999999",
  
	'ADD': '#9999aa',
	'SUB': '#9999aa',
	'MUL': '#9999aa',
	'DIV': '#9999aa',

	'DQT': '#cc8888',
	'SQT': '#cc8888',

    'COL': '#FF0000',
    'SCL': '#FF0000',

    'DEC': '#000000',
    'SEP': '#000000',

	'LES': '#FF9900',
	'EQL': '#FF9900',
	'GRE': '#FF9900',

    'LPR': '#000000',
    'RPR': '#000000',

    'LBK': '#000000',
    'RBK': '#000000',
	
    'LBR': '#000000',
    'RBR': '#000000',
	
    'DOL': '#000000',
	'USC': '#000000',
    'DSN': '#000000',
    'PER': '#000000',
	'ATL': '#000000',
    'BTK': '#000000',
	
    'ESC': '#000000',
    'SPC': '#000000',
    'EOL': '#000000',
	
	
	"STR": "#48BF00",
	"BOL": "#9999FF",
	"EOS": "#000000",
	"NUM": "#FF6F00",
	"RWD": "#000000",
	"KWD": "#0055FF",
	"LTR": "#000000",
	"DIG": "#000000",
	"SDC": "#DD0000",
	"NUL": "#AA22EE"
}


pysd.SYNTAX_HIGHLIGHTING.update_line = function(line) {
	var code = pysd.EDITOR.get_code_line(line);
	var output = []
	var tokens = pysd.PARSER.LEXER.tokenize([code], true)
	var line = document.querySelector('tr[data-line="' + line + '"] div[data-line="' + line + '"]')
	line.innerHTML = ""
	for (var x = 0; x < tokens.length; x++) {
		var current = document.createElement('span')
		var content = document.createTextNode(code.slice(tokens[x].START, tokens[x].END + 1));
		current.style.color = pysd.SYNTAX_HIGHLIGHTING.TOKEN_MAP[tokens[x].NAME]
		current.appendChild(content)
		line.appendChild(current)
	}
}

pysd.SYNTAX_HIGHLIGHTING.update_all = function() {
	for (var x = 0; x < document.getElementsByClassName('code-content').length; x++) {
		pysd.SYNTAX_HIGHLIGHTING.update_line(x + 1)
	}
}


// #####################################################################
// #####################################################################
// #####################################################################
// ###################### BEGIN LEXER / PARSER #########################
// #####################################################################
// #####################################################################
// #####################################################################

// ########### Lexer ########### 

pysd.PARSER.LEXER.TOKEN = function(tname, value, line, start, end) {
	if (!(this instanceof pysd.PARSER.LEXER.TOKEN)) {return new pysd.PARSER.LEXER.TOKEN(tname, value, line, start, end)}
	this.NAME = tname;
	this.TOKEN = value;
	this.LINE = line
	if (typeof(end) == "undefined") {end = start}
	this.START = start
	this.END = end
}

pysd.PARSER.LEXER.read_token = function(chr, line, index, ignore_errors) {
	var ignore_errors = ignore_errors || false
	if (pysd.TOOLS.search(pysd.PARSER.LEXER.ALPHA, chr)) {
		return pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS["letter"], chr, line, index)
	}
	else if (pysd.TOOLS.search(pysd.PARSER.LEXER.NUMERIC, chr)) {
		return pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS["digit"], chr, line, index)
	}
	else if (pysd.PARSER.LEXER.TOKENS[chr] !== undefined) {
		return pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.TOKENS[chr], null, line, index)
	}
	else if (ignore_errors) {
		return pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS["unknown"], chr, line, index)
	}
	
	else {
		throw pysd.PARSER.LEXER.TokenizerException("Token invalid outside literal: \"" + chr + "\"", line)
	}
}

pysd.PARSER.LEXER.locate_token = function(token) {
	for (x in pysd.PARSER.LEXER.TOKENS) {
		if (pysd.PARSER.LEXER.TOKENS[x] === token) {
			return x
		}
	}
}

pysd.EXCEPTIONS.ERROR('PARSER.LEXER.TokenizerException')
pysd.EXCEPTIONS.ERROR('PARSER.PARSER.ParserException')

pysd.PARSER.LEXER.ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
pysd.PARSER.LEXER.NUMERIC = "01234567890."
pysd.PARSER.LEXER.ASCII = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~"

pysd.PARSER.LEXER.TOKENS = {   
	'\n': 'EOL',
    '"': 'DQT',
    "'": 'SQT',
    '(': 'LPR',
    ')': 'RPR',
    '{': 'LBR',
    '}': 'RBR',
    '[': 'LBK',
    ']': 'RBK',
    ',': 'SEP',
    '.': 'DEC',
    ':': 'COL',
    ';': 'SCL',
    '<': 'LES',
    '>': 'GRE',
    '=': 'EQL',
    '+': 'ADD',
    '-': 'SUB',
    '*': 'MUL',
    '/': 'DIV',
    '%': 'PER',
    '@': 'DSN',
    '$': 'DOL',
    '_': 'USC',
    '`': 'BTK',
    '~': 'ATL',
    '\\': 'ESC',
    ' ': 'SPC'
}

pysd.PARSER.LEXER.OTHERTOKENS = {
	"string": "STR",
	"boolean": "BOL",
	"comment": "COM",
	"statementend": "EOS",
	"number": "NUM",
	"word": "RWD",
	"keyword": "KWD",
	"letter": "LTR",
	"digit": "DIG",
	"decorator": "SDC",
	"unknown": "NUL"
}

pysd.PARSER.LEXER.KEYWORDS = [
	"or",
	"and",
	"not",
	"when",
	"cloned",
	"flag",
	"keypress",
	"clicked",
	"scene",
	"environment",
	"recieve",
	"var",
	"list",
	"public",
	"function",
	"cloud",
	"repeat",
	"forever",
	"if",
	"else",
	"until"
]

pysd.PARSER.LEXER.BOOLEAN = [
	"true",
	"false"
]

pysd.PARSER.LEXER.tokenize = function(content, ignore_errors) {
	var borders = [0]
	for (var x = 0; x < content.length; x++) {
		borders.push(borders[borders.length - 1] + content[x].length + 1)
	}
	function index_line(index, borders) {
		for (var z = 0; z < borders.length; z++) {
			if (index < borders[z]) {
				return z - 1
			}
		}		
	}
	content = content.join('\n')
	var ignore_errors = ignore_errors || false
	var tokens = []
	var in_literal = false
	var in_word = false
	var in_number = false
	var in_decorator = false
	var in_comment = false
	var current_stack = ""
	var enclosing_paren = ""
	var element_start;
	var lineno;
	for (var x = 0; x < content.length; x++) {
		lineno = index_line(x, borders) + 1
		if (in_literal) {
			if ((content[x] === enclosing_paren) && (content[x - 1] != pysd.PARSER.LEXER.locate_token('ESC'))) {
				tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['string'], current_stack, lineno, element_start, x))
				in_literal = false
				enclosing_paren = ""
				current_stack = ""
			}
			else if ((content[x] === pysd.PARSER.LEXER.locate_token('ESC')) && (content[x + 1] == enclosing_paren)) {}
			else if ((content[x] === pysd.PARSER.LEXER.locate_token('EOL'))) {
				if (ignore_errors) {
					tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['string'], current_stack, lineno, element_start, x))
					in_literal = false
					enclosing_paren = ""
					current_stack = ""				
				}
				else {
					throw pysd.PARSER.LEXER.TokenizerException("EOL encountered while scanning literal. Please check to make sure all quotes are closed.", lineno)
				}
			}
			else {
				current_stack += content[x]
			}
			continue
		}
		else if (in_word) {
			if ((!pysd.TOOLS.search(pysd.PARSER.LEXER.ALPHA, content[x])) && (content[x] != pysd.PARSER.LEXER.locate_token('USC'))) {
				var tname;
				if (pysd.PARSER.LEXER.KEYWORDS.indexOf(current_stack) !== -1) {
					tname = 'keyword'
				}
				else if (pysd.PARSER.LEXER.BOOLEAN.indexOf(current_stack) !== -1) {
					tname = "boolean"
				}
				else {
					tname = 'word'
				}
				tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS[tname], current_stack, lineno, element_start, x - 1))
				in_word = false
				current_stack = ""
			}
			else {
				current_stack += content[x]
				continue
			}
		}
		else if (in_number) {
			if (!pysd.TOOLS.search(pysd.PARSER.LEXER.NUMERIC, content[x])) {
				if ((parseInt(current_stack) == NaN) && (!ignore_errors)) {
					throw pysd.PARSER.LEXER.TokenizerException("Invalid integer/float: \"" + current_stack + "\"", lineno)
				}
				if (parseInt(current_stack) !== parseFloat(current_stack)) {
					var num = parseFloat(current_stack)
				}
				else {
					var num = parseInt(current_stack)
				}
				tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['number'], num, lineno, element_start, x - 1))
				in_number = false
				current_stack = ""
			}
			else {
				current_stack += content[x]
				continue
			}
		}
		else if (in_decorator) {
			if (!pysd.TOOLS.search(pysd.PARSER.LEXER.ASCII, content[x])) {
				tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['decorator'], current_stack, lineno, element_start, x - 1))
				in_decorator = false
				current_stack = ""
			}
			else {
				current_stack += content[x]
				continue
			}			
		}
		else if (in_comment) {
			if (content[x] === pysd.PARSER.LEXER.locate_token('EOL')) {
				tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['comment'], current_stack.slice(1), lineno, element_start, x - 1))
				in_comment = false
				current_stack = ""
			}
			else {
				current_stack += content[x]
				continue
			}			
		}
		if ((content[x] == pysd.PARSER.LEXER.locate_token('DQT')) || (content[x] == pysd.PARSER.LEXER.locate_token('SQT'))) {
			in_literal = true
			element_start = x
			enclosing_paren = content[x]
			current_stack = ""
			continue
		}
		if (pysd.TOOLS.search(pysd.PARSER.LEXER.ALPHA, content[x])) {
			in_word = true
			element_start = x
			current_stack = content[x]
			continue
		}
		if (pysd.TOOLS.search(pysd.PARSER.LEXER.NUMERIC, content[x])) {
			in_number = true
			element_start = x
			current_stack = content[x]
			continue
		}
		if (content[x] == pysd.PARSER.LEXER.locate_token("DSN")) {
			in_decorator = true
			element_start = x
			current_stack = ""
			continue
		}
		if ((content[x] == pysd.PARSER.LEXER.locate_token("DIV")) && (content[x + 1] == pysd.PARSER.LEXER.locate_token("DIV"))) {
			in_comment = true
			element_start = x
			current_stack = ""
			continue
		}
		if ((content[x] == pysd.PARSER.LEXER.locate_token("SCL")) || (content[x] == pysd.PARSER.LEXER.locate_token("EOL"))) {
			tokens.push(pysd.PARSER.LEXER.TOKEN("EOS", null, lineno, x))
		}
		else {
			tokens.push(pysd.PARSER.LEXER.read_token(content[x], lineno, x, ignore_errors))
		}
	} 
	if (in_literal) {
		if (ignore_errors) {
			tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['string'], current_stack, lineno, element_start, x - 1))			
		}
		else {
			throw pysd.PARSER.LEXER.TokenizerException("EOL encountered while scanning literal. Please check to make sure all quotes are closed.", lineno)
		}
	}
	else if (in_word) {
		var tname;
		if (pysd.PARSER.LEXER.KEYWORDS.indexOf(current_stack) !== -1) {
			tname = 'keyword'
		}
		else if (pysd.PARSER.LEXER.BOOLEAN.indexOf(current_stack) !== -1) {
			tname = "boolean"
		}
		else {
			tname = 'word'
		}
		tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS[tname], current_stack, lineno, element_start, x - 1))
	}
	else if (in_number) {
		if ((parseInt(current_stack) == NaN) && (!ignore_errors)) {
			throw pysd.PARSER.LEXER.TokenizerException("Invalid integer/float: \"" + current_stack + "\"", lineno)
		}
		if (parseInt(current_stack) !== parseFloat(current_stack)) {
			var num = parseFloat(current_stack)
		}
		else {
			var num = parseInt(current_stack)
		}
		tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['number'], num, lineno, element_start, x - 1))
	}
	else if (in_decorator) {
		tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['decorator'], current_stack, lineno, element_start, x - 1))
	}
	else if (in_comment) {
		tokens.push(pysd.PARSER.LEXER.TOKEN(pysd.PARSER.LEXER.OTHERTOKENS['comment'], current_stack.slice(1), lineno, element_start, x - 1))
	}
	return tokens
}


// ########### Parser ###########

pysd.PARSER.PARSER.TOKEN_PATTERNS = [
	"",
	"KWD:public KWD:var",
	"KWD:public KWD:cloud KWD:"
]


pysd.PARSER.PARSER.parse_tokens = function(tokens) {
	// ## Step 1 | Seperate Decorators ##
	var sprites = {}
	var current_sprite = null
	var current_sprite_name = null
	for (var x = 0; x < tokens.length; x++) {
		if (tokens[x].NAME === "SDC") {
			if (current_sprite !== null) {
				sprites[current_sprite_name] = current_sprite
			}
			if (sprites[tokens[x].TOKEN] !== undefined) {
				throw pysd.PARSER.PARSER.ParserException('Duplicate decorator "' + tokens[x].TOKEN + '"', tokens[x].LINE)
			}
			current_sprite = []
			current_sprite_name = tokens[x].TOKEN
		}
		else if ((current_sprite == null) && (tokens[x].NAME != "COM") && (tokens[x].NAME != "SPC") && (tokens[x].NAME != "EOL") && (tokens[x].NAME != "EOS")) {
			throw pysd.PARSER.PARSER.ParserException('Tokens before sprite decorator cannot be used.', tokens[x].LINE)
		}
		else if (!((current_sprite.length == 0) && (tokens[x].NAME == "EOS"))) {
			current_sprite.push(tokens[x])				
		}
	}
	if (current_sprite !== null) {
		sprites[current_sprite_name] = current_sprite
	}
	// ## Step 2 | Validate Keyword Statements ##
	
}


















// ########### Binding Events ###########

window.addEventListener("DOMContentLoaded", pysd.CALLBACKS.on_load);