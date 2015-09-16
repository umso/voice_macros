// ---------------------------------------------------------------------------
// CasperRenderer -- a class to render recorded tests to a CasperJS
// test format.
// ---------------------------------------------------------------------------

var LOG_LEVEL = {
	INFO: 1
};
var SCRIPT_SIGNATURE = 'VCMDRv1';
var TAKE_SSHOTS = true;

function CasperRenderer(title, recording) {
	this.title = title;
	this.items = recording;
	this.history = [];
	this.last_events = [];
	this.screen_id = 1;
	this.unamed_element_id = 1;
	this.textContent = '';
}

(function(My) {
    var proto = My.prototype;
    var EC = VOICE_COMMANDER_EVENT_CODE;
	var TAB_SIZE = 4;

    proto.writeln = function(txt) {
        this.textContent += txt + '\n';
        return this;
    };

    proto.stmt = function(text, indent) {
        var output = '';
        indent = indent || 0;

		indent += 3; // We are inside a function body so add an extra tabs

        for(var i = 0; i<indent*TAB_SIZE; i++) {
            output += ' ';
        }
        output += text;

        return this.writeln(output);
    };

	proto.emitStatement = function(type, body, indent) {
		return this.stmt('this.emit(' + this.pyrepr(type) + ', ' + body + ')', indent);
	};

	proto.logStatement = function(message, logLevel, indent) {
		return this.emitStatement('log', JSON.stringify({
			message: message,
			level: logLevel
		}), indent);
	};

	proto.sayStatement = function(message, indent) {
		return this.emitStatement('say', message, indent);
	};
	proto.voicePromptStatement = function(message, indent) {
		return this.emitStatement('voicePrompt', this.pyrepr(message), indent);
	};

    proto.cont = function(text) {
        return this.writeln('   ... ' + text);
    };

    proto.pyout = function(text) {
        return this.writeln('  ' + text);
    };

    proto.pyrepr = function(text, escape) {
        return "'" + (escape ? text.replace(/(['"])/g, "\\$1") : text) + "'";
    };

    proto.space = function() {
        return this.writeln('');
    };

    proto.regexp_escape = function(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
    };

    proto.cleanStringForXpath = function(str, escape)  {
        var parts  = str.match(/[^'"]+|['"]/g);
        parts = parts.map(function(part){
            if (part === "'")  {
                return '"\'"'; // output "'"
            }

            if (part === '"') {
                return "'\"'"; // output '"'
            }
            return "'" + part + "'";
        });

        var xpath = (parts.length>1) ? "concat(" + parts.join(",") + ")" : parts[0];

        return escape ? xpath.replace(/(["])/g, "\\$1") : xpath;
    };

    var d = {};
    d[EC.OpenUrl] = "openUrl";
    d[EC.Click] = "click";
    //d[EventTypes.Change] = "change";
    d[EC.Comment] = "comment";
    d[EC.Submit] = "submit";
    d[EC.CheckPageTitle] = "checkPageTitle";
    d[EC.CheckPageLocation] = "checkPageLocation";
    d[EC.CheckTextPresent] = "checkTextPresent";
    d[EC.CheckValue] = "checkValue";
    d[EC.CheckText] = "checkText";
    d[EC.CheckHref] = "checkHref";
    d[EC.CheckEnabled] = "checkEnabled";
    d[EC.CheckDisabled] = "checkDisabled";
    d[EC.CheckSelectValue] = "checkSelectValue";
    d[EC.CheckSelectOptions] = "checkSelectOptions";
    d[EC.CheckImageSrc] = "checkImageSrc";
    d[EC.PageLoad] = "pageLoad";
    d[EC.ScreenShot] = "screenShot";
    /*d[EC.MouseDown] = "mousedown";
    d[EC.MouseUp] = "mouseup";*/
    d[EC.MouseDrag] = "mousedrag";
    d[EC.KeyPress] = "keypress";
    d[EC.ReadElement] = "readelement";
    d[EC.ClickWhen] = "clickwhen";
    d[EC.SetVarValue] = "setvarvalue";
    d[EC.RequestVarValue] = "requestvarvalue";

    proto.dispatch = d;

	proto.getItem = function(index) {
		return this.items[index];
	};

	proto.numItems = function() {
		return this.items.length;
	};

	proto.getType = function(item) {
		return item ? item.type : false;
	};

	proto.getIndexType = function(index) {
		return this.getType(this.getItem(index));
	};
	proto.takeScreenshot = function(ss_name, indent) {
		if(!indent) { indent = 0; }

        this.stmt('spooky.then(function() {', indent)
            .stmt('this.page.render("' + ss_name + '");', indent + 1)
            .stmt('});', indent);
	};

	proto.renderBody = function(with_xy) {
        this.with_xy = !!with_xy;
        var last_down = null;
        var forget_click = false;
        for (var i=0; i < this.numItems(); i++) {
	        var item = this.getItem(i),
				type = this.getType(item);

	        if(i===0) {
	            if(type!=EC.OpenUrl) {
	                this.stmt("//ERROR: the recorded sequence does not start with a url.");
	            } else {
	                this.startUrl(item);
					//this.takeScreenshot('scripts/sshot_' + i + '.png');
	            }
	        } else if(type === EC.MouseDown) {
		        // remember last MouseDown to identify drag
	            last_down = item;
	        } else if(type==EC.MouseUp && last_down) {
	            if(last_down.x == item.x && last_down.y == item.y) {
	                forget_click = false;
	            } else {
	                item.before = last_down;
	                this[this.dispatch[EC.MouseDrag]](item);
	                last_down = null;
	                forget_click = true;
					//this.takeScreenshot('scripts/sshot_' + i + '.png');
	            }
	        } else if(type === EC.Click && forget_click) {
	            forget_click = false;
	        } else if (this.dispatch[type]) {
	            this[this.dispatch[type]](item, i);
				//this.takeScreenshot('scripts/sshot_' + i + '.png');
	        }
        }
	};

    proto.render = function(with_xy) {
		return	this.writeHeader().then($.proxy(function() {
					return this.renderBody(with_xy);
				}, this)).then($.proxy(function() {
					return this.writeFooter();
				}, this)).then($.proxy(function() {
					return this.textContent;
				}, this)).then($.proxy(function(scriptBody) {
					return {
						title: this.title,
						body: scriptBody
					};
				}, this));
    };

    proto.writeHeader = function() {
		return Promise.all([getFile('casper_template/casper_header.js'), getName()]).then($.proxy(function(promiseValues) {
			var headerContent = promiseValues[0],
				name = promiseValues[1],
		        date = new Date();

	        this.stmt("//" + SCRIPT_SIGNATURE + " " + JSON.stringify(name), -10)
				.stmt("//========================================================", -10)
	            .stmt("// Casper generated " + date, -10)
	            .stmt("//========================================================", -10)
	            .space();

			if(headerContent) {
		        var firstItem = this.getItem(0);
				if(firstItem.width && firstItem.height) {
					headerContent = headerContent.replace('viewportSize: {}', 'viewportSize: ' + JSON.stringify({
						width: firstItem.width,
						height: firstItem.height
					}));
				}
				this.writeln(headerContent);
			}
		}, this));
    };

    proto.writeFooter = function() {
		return getFile('casper_template/casper_footer.js').then($.proxy(function(footerContent) {
			if(footerContent) {
				this.writeln(footerContent);
			}
		}, this));
    };

    proto.rewriteUrl = function(url) {
        return url;
    };

    proto.shortUrl = function(url) {
        return url.substr(url.indexOf('/', 10));
    };

    proto.startUrl = function(item) {
		var url = this.pyrepr(this.rewriteUrl(item.url));

		this.stmt("spooky.start(" + url + ", function() {")
			.stmt("this.env = {};", 1)
			.logStatement('Started at ' + url + '', LOG_LEVEL.INFO, 1)
			.stmt("});")
			.space()
			.stmt("spooky.then([{")
			.stmt("args: args", 1)
			.stmt("}, function() {", 1)
			.stmt("this.env = args;", 2)
			.stmt("}]);");
    };

    proto.openUrl = function(item, index) {
        var url = this.pyrepr(this.rewriteUrl(item.url));
        var history = this.history;
		var previousStep = this.getItem(index-1);

        // if the user apparently hit the back button, render the event as such
        if (url == history[history.length - 2]) {
            this.stmt('spooky.then(function() {')
                .stmt('this.back();', 1)
                .stmt('});');

            history.pop();
            history.pop();
        } else if(!previousStep || previousStep.type !== EC.Submit) {
            this.stmt("spooky.thenOpen(" + url + ");");
        }
    };

    proto.pageLoad = function(item) {
        var url = this.pyrepr(this.rewriteUrl(item.url));
        this.history.push(url);
    };

    proto.normalizeWhitespace = function(s) {
        return s.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\s+/g, ' ');
    };

    proto.getControl = function(info) {
        var type = info.type;
        var tag = info.tagName.toLowerCase();
        var selector;

        if ((type == "submit" || type == "button") && info.value) {
            selector = tag+'[type='+type+'][value='+this.pyrepr(this.normalizeWhitespace(info.value))+']';
        } else if (info.name) {
            selector = tag+'[name='+this.pyrepr(info.name)+']';
        } else if (info.id) {
            selector = tag+'#'+info.id;
        } else {
            selector = info.selector;
        }

        return selector;
    };

    proto.getLinkXPath = function(item) {
        var way;
        if (item.text) {
            way = 'normalize-space(text())=' + this.cleanStringForXpath(this.normalizeWhitespace(item.text), true);
        } else if (item.info.id) {
            way = '@id=' + this.pyrepr(item.info.id);
        } else if (item.info.href){
            way = '@href=' + this.pyrepr(this.shortUrl(item.info.href));
        } else if (item.info.title){
            way = 'title='+this.pyrepr(this.normalizeWhitespace(item.info.title));
        }

        return way;
    };

    proto.mousedrag = function(item) {
        if(this.with_xy) {
            this.stmt('spooky.then(function() {')
                .stmt('this.mouse.down('+ item.before.x + ', '+ item.before.y +');', 1)
                .stmt('this.mouse.move('+ item.x + ', '+ item.y +');', 1)
                .stmt('this.mouse.up('+ item.x + ', '+ item.y +');', 1)
                .stmt('});');
        }
    };

	proto.getElementSelector = function(item) {
        var tag = item.info.tagName.toLowerCase();
        var selector;
        if (tag == 'a') {
            var xpath_selector = this.getLinkXPath(item);
            if(xpath_selector) {
				selector = '{type:"xpath", path: "//a['+ xpath_selector +']"}';
                //selector = 'x("//a['+xpath_selector+']")';
            } else {
                selector = item.info.selector;
            }
        } else if (tag == 'input' || tag == 'button') {
            selector = this.getFormSelector(item) + this.getControl(item.info);
            selector = '"' + selector + '"';
        } else {
            selector = '"' + item.info.selector + '"';
        }

		return selector;
	};

    proto.click = function(item) {
        var tag = item.info.tagName.toLowerCase();
        if(this.with_xy && !(tag == 'a' || tag == 'input' || tag == 'button')) {
            this.stmt('spooky.then(function() {')

				.switchToChildFrame(item.frame, 4)
                .stmt('this.mouse.click(' + item.x + ', ' + item.y + ');', 1)
				.logStatement('Clicked (' + item.x + ', ' + item.y + ')', LOG_LEVEL.INFO, 1)
				.escapeChildFrame(item.frame, 4)

                .stmt('});');
        } else {
			var selector = this.getElementSelector(item);

            //this.stmt('spooky.waitForSelector('+ selector + ',')
			this.waitForSelector(selector, item.frame)
	            .stmt('spooky.then(')
                .stmt('function () {', 1)

				.switchToChildFrame(item.frame, 2)
                .stmt('this.click('+ selector + ');', 2)
				.logStatement('Clicked ' + selector, LOG_LEVEL.INFO, 2)
				.escapeChildFrame(item.frame, 2)

                .stmt('});', 1)
				.space();
        }
    };

    proto.getFormSelector = function(item) {
        var info = item.info;

        if(!info.form) {
            return '';
        } else if(info.form.name) {
            return "form[name=" + info.form.name + "] ";
        } else if(info.form.id) {
            return "form#" + info.form.id + " ";
        } else {
            return "form ";
        }
    };

    proto.keypress = function(item, index) {
        var text = item.text.replace('\n','').replace('\r', '\\r'),
			selector = '"' + this.getControl(item.info) + '"';

		if(this.getIndexType(index+1) === EC.Change) {
			var changeItem = this.getItem(index+1);
			text = changeItem.info.value;
		}

        //this.stmt('spooky.waitForSelector("' + selector + '",')
		this.waitForSelector(selector, item.frame)
	        .stmt('spooky.then(')
            .stmt('function () {', 1)

			.switchToChildFrame(item.frame, 2)
            .stmt('this.sendKeys(' + selector + ', "' + text + '");', 2)
			.logStatement('Sent Keys ' + selector, LOG_LEVEL.INFO, 2)
			.escapeChildFrame(item.frame, 2)

            .stmt('});', 1)
			.space();
    };

    proto.submit = function(item) {
        // the submit has been called somehow (user, or script)
        // so no need to trigger it.
        this.stmt("/* submit form */");

		var formSelector = this.getFormSelector(item);

/*
		this.waitForSelector(formSelector, item.frame)
	        .stmt('spooky.then(')
            .stmt('function () {', 1)

			.switchToChildFrame(item.frame, 2)
            .stmt('this.fill("' + formSelector + '", {}, true);', 2)
			.logStatement('Filled form ' + formSelector, LOG_LEVEL.INFO, 2)
			.escapeChildFrame(item.frame, 2)

            .stmt('});', 1)
			.space();
			*/
    };

    proto.screenShot = function(item) {
        // wait 1 second is not the ideal solution, but will be enough most
        // part of time. For slow pages, an assert before capture will make
        // sure evrything is properly loaded before screenshot.
        this.stmt('spooky.wait(1000);')
            .stmt('spooky.then(function() {')
            .stmt('this.captureSelector("screenshot'+this.screen_id+'.png", "html");', 1)
            .stmt('});')
			.space();
        this.screen_id = this.screen_id + 1;
    };

    proto.comment = function(item) {
        var lines = item.text.split('\n');

        this.space();
        for (var i=0; i < lines.length; i++) {
			this.stmt('// ' + lines[i])
		}
		this.space();
    };

	// read the content of an element out loud
	proto.readelement = function(item, index) {
		var commonAncestorControl = '"' + this.getControl(item.commonAncestorContainer) + '"';

		this.space()
			.waitForSelector(commonAncestorControl, item.frame)
			//.stmt('spooky.waitForSelector("' + commonAncestorControl + '",')
			.stmt('spooky.then(')
			.stmt('function() {', 1)

			.switchToChildFrame(item.frame, 2)
			.sayStatement('this.fetchText('+commonAncestorControl+')', 2)
			.logStatement('Read ' + commonAncestorControl, LOG_LEVEL.INFO, 2)
			.escapeChildFrame(item.frame, 2)

            .stmt('});', 1)
			.space();
	};

	proto.switchToChildFrame = function(framePath, indent) {
		for(var i = 0; i<framePath.length; i++) {
			this.stmt('this.page.switchToFrame(' + framePath[i] + ');', indent);
		}
		return this;
	};

	proto.escapeChildFrame = function(framePath, indent) {
		if(framePath.length > 0) {
			this.stmt('this.page.switchToMainFrame();', indent);
		}

		return this;
	};

	proto.waitForSelector = function(selector, framePath, indent, onThen, onTimeout) {
		if(!indent) { indent = 0; }

		return this	.stmt('spooky.then(function() {', indent)
					.stmt('this.waitingForFn = function() {', indent+1)
					.switchToChildFrame(framePath, indent+2)
					.stmt('var exists = this.exists(' + selector + ');', indent+2)
					.escapeChildFrame(framePath, indent+2)
					.stmt('return exists;', indent+2)
					.stmt('}', indent+1)
					.stmt('});')
					.space()
					.stmt('spooky.waitFor(function() {', indent)
					.stmt('var canContinue = this.waitingForFn();', indent+1)
					.stmt('if(canContinue) {', indent+1)
					.stmt('delete this.waitingForFn;', indent+2)
					.stmt('}', indent+1)
					.stmt('return canContinue;', indent+1)
					.stmt('},', indent)
					.stmt('function() {}, ', indent)
					.stmt('function() {', indent)
					.stmt('var info = { ssid: "sshot.png" };', indent+1)
					.stmt('this.page.render("sshots/" + info.ssid);', indent+1)
					.emitStatement('requestInteraction', 'info', indent+1)
					.stmt('}', indent)
					.stmt(');', indent);
	};


	// click on some condition of a variable value
	proto.clickwhen = function(item, index) {
		var varName = item.var_name,
			value = item.value;

		var selector = this.getElementSelector(item);

        this.space()
			.stmt('spooky.then(function() {')
			.stmt('if(this.env['+ this.pyrepr(varName) +'] === ' + this.pyrepr(value) + ') {', 1)

			.waitForSelector(selector, item.frame, 2)

            //.stmt('spooky.waitForSelector('+ selector + ',', 2)
            .stmt('spooky.then(', 2)
            .stmt('function () {', 3)

			.switchToChildFrame(item.frame, 4)
            .stmt('this.click('+ selector + ');', 4)
			.escapeChildFrame(item.frame, 4)

			.logStatement('Clicked ' + selector, LOG_LEVEL.INFO, 4)
            .stmt('});', 2)
            .stmt('}', 1)
            .stmt('});')
			.space();
	};

	// set the value of a variable to a text selection
	proto.setvarvalue = function(item, index) {
		var commonAncestorControl = this.getControl(item.commonAncestorContainer);
		var varName = item.var_name;

		this.space()
			.waitForSelector(commonAncestorControl, item.frame)
			//.stmt('spooky.waitForSelector("' + commonAncestorControl + '",')
			.stmt('spooky.then(')
			.stmt('function() {', 1)

			.switchToChildFrame(item.frame, 2)
			.stmt('this.env['+this.pyrepr(varName)+'] = this.fetchText("'+commonAncestorControl+'");', 2)
			.logStatement('Got ' + this.pyrepr(varName), LOG_LEVEL.INFO, 2)
			.escapeChildFrame(item.frame, 2)

            .stmt('});', 1)
			.space();
	};

	// ask, through voice, for the value of a variable
	proto.requestvarvalue = function(item, index) {
		var varName = item.var_name,
			requestText = item.request_text;

		this.space()
            .stmt('spooky.then(function() {')
			.voicePromptStatement(requestText, 1)
			.logStatement('Prompt ' + this.pyrepr(varName) + ' as ' + this.pyrepr(requestText), LOG_LEVEL.INFO, 1)
            .stmt('});')
            .stmt('spooky.then(function() {')
			.stmt('this.env['+this.pyrepr(varName)+'] = this.promptResult;', 1)
			.stmt('delete this.promptResult;', 1)
			.logStatement('Got ' + this.pyrepr(varName), LOG_LEVEL.INFO, 1)
            .stmt('});')
			.space();
	};


	function getFile(filename) {
		return new Promise(function(resolve, reject) {
			$.ajax({
				url: chrome.extension.getURL(filename),
				dataType: 'text'
			}).done(function(data) {
				resolve(data);
			});
		});
	}
} (CasperRenderer));
