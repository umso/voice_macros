// ---------------------------------------------------------------------------
// CasperRenderer -- a class to render recorded tests to a CasperJS
// test format.
// ---------------------------------------------------------------------------

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

    proto.writeln = function(txt) {
        this.textContent += txt + '\n';
        return this;
    };

    proto.stmt = function(text, indent) {
        var output = '';
        indent = indent || 0;

		indent += 2; // We are inside two nested loops, so add two tabs

        for(var i = 0; i<indent*4; i++) {
            output += ' ';
        }
        output += text;

        return this.writeln(output);
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
    d[EC.MouseUp] = "mouseup"; */
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
	}

	proto.renderBody = function(with_xy) {
        this.with_xy = !!with_xy;
        var last_down = null;
        var forget_click = false;

        for (var i=0; i < this.numItems(); i++) {
	        var item = this.getItem(i),
				type = this.getType(item);

	        if(i===0) {
	            if(type!=EC.OpenUrl) {
	                this.writeln("//ERROR: the recorded sequence does not start with a url openning.");
	            } else {
	                this.startUrl(item);
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
	            }
	        } else if(type === EC.Click && forget_click) {
	            forget_click = false;
	        } else if (this.dispatch[type]) {
	            this[this.dispatch[type]](item, i);
	        }
        }
	};

    proto.render = function(with_xy) {
		return	this.writeHeader().then($.proxy(function() {
					return this.renderBody();
				}, this)).then($.proxy(function() {
					return this.writeFooter();
				}, this)).then($.proxy(function() {
					return this.textContent;
				}, this));
    };

    proto.writeHeader = function() {
		return getFile('casper_template/casper_header.js').then($.proxy(function(headerContent) {
	        var date = new Date();

	        this.stmt("//========================================================", 0)
	            .stmt("// Casper generated " + date, 0)
	            .stmt("//========================================================", 0)
	            .space();

			if(headerContent) {
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

		this.space()
			.stmt("spooky.start(" + url + ");")
			.space();
    };

    proto.openUrl = function(item) {
        var url = this.pyrepr(this.rewriteUrl(item.url));
        var history = this.history;

        // if the user apparently hit the back button, render the event as such
        if (url == history[history.length - 2]) {
            this.stmt('spooky.then(function() {')
                .stmt('this.back();', 1)
                .stmt('});');

            history.pop();
            history.pop();
        } else {
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

    proto.getControl = function(item) {
        var type = item.info.type;
        var tag = item.info.tagName.toLowerCase();
        var selector;

        if ((type == "submit" || type == "button") && item.info.value) {
            selector = tag+'[type='+type+'][value='+this.pyrepr(this.normalizeWhitespace(item.info.value))+']';
        } else if (item.info.name) {
            selector = tag+'[name='+this.pyrepr(item.info.name)+']';
        } else if (item.info.id) {
            selector = tag+'#'+item.info.id;
        } else {
            selector = item.info.selector;
        }

        return selector;
    };

    proto.getControlXPath = function(item) {
        var type = item.info.type;
        var way;

        if ((type == "submit" || type == "button") && item.info.value){
            way = '@value=' + this.pyrepr(this.normalizeWhitespace(item.info.value));
        } else if (item.info.name) {
            way = '@name=' + this.pyrepr(item.info.name);
        } else if (item.info.id) {
            way = '@id=' + this.pyrepr(item.info.id);
        } else {
            way = 'TODO';
        }

        return way;
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

    proto.click = function(item) {
        var tag = item.info.tagName.toLowerCase();
        if(this.with_xy && !(tag == 'a' || tag == 'input' || tag == 'button')) {
            this.stmt('spooky.then(function() {')
                .stmt('this.mouse.click('+ item.x + ', '+ item.y +');', 1)
                .stmt('});');
        } else {
            var selector;
            if (tag == 'a') {
                var xpath_selector = this.getLinkXPath(item);
                if(xpath_selector) {
                    selector = 'x("//a['+xpath_selector+']")';
                } else {
                    selector = item.info.selector;
                }
            } else if (tag == 'input' || tag == 'button') {
                selector = this.getFormSelector(item) + this.getControl(item);
                selector = '"' + selector + '"';
            } else {
                selector = '"' + item.info.selector + '"';
            }

            this.stmt('spooky.waitForSelector('+ selector + ',')
                .stmt('function () {', 1)
                .stmt('this.click('+ selector + ');', 2)
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
        var text = item.text.replace('\n','').replace('\r', '\\r');
		if(this.getIndexType(index+1) === EC.Change) {
			var changeItem = this.getItem(index+1);
			text = changeItem.info.value;
		}

        this.stmt('spooky.waitForSelector("' + this.getControl(item) + '",')
            .stmt('function () {', 1)
            .stmt('this.sendKeys("' + this.getControl(item) + '", "' + text + '");', 2)
            .stmt('});', 1)
			.space();
    };

    proto.submit = function(item) {
        // the submit has been called somehow (user, or script)
        // so no need to trigger it.
        this.stmt("/* submit form */");
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

	};

	// click on some condition of a variable value
	proto.clickwhen = function(item, index) {

	};

	// set the value of a variable to a text selection
	proto.setvarvalue = function(item, index) {

	};

	// ask, through voice, for the value of a variable
	proto.requestvarvalue = function(item, index) {

	};

	/*

    proto.checkPageTitle = function(item) {
        var title = this.pyrepr(item.title, true);
        this.stmt('casper.then(function() {', 1)
            .stmt('test.assertTitle(' + title + ');', 2)
            .stmt('});', 1);
    };

    proto.checkPageLocation = function(item) {
        var url = this.regexp_escape(item.url);
        this.stmt('casper.then(function() {')
            .stmt('test.assertUrlMatch(/^' + url + '$/);', 2)
            .stmt('});');
    };

    proto.checkTextPresent = function(item) {
        var selector = 'x("//*[contains(text(), '+this.pyrepr(item.text, true)+')]")';
        this.waitAndTestSelector(selector);
    };

    proto.checkValue = function(item) {
        var type = item.info.type;
        var way = this.getControlXPath(item);
        var selector = '';
        if (type == 'checkbox' || type == 'radio') {
            var selected;
            if (item.info.checked) {
                selected = '@checked'
            } else {
                selected = 'not(@checked)'
                selector = 'x("//input[' + way + ' and ' +selected+ ']")';
            }
        } else {
            var value = this.pyrepr(item.info.value)
            var tag = item.info.tagName.toLowerCase();
            selector = 'x("//'+tag+'[' + way + ' and @value='+value+']")';
        }
        this.waitAndTestSelector(selector);
    };

    proto.checkText = function(item) {
        var selector = '';
        if ((item.info.type == "submit") || (item.info.type == "button")) {
            selector = 'x("//input[@value='+this.pyrepr(item.text, true)+']")';
        } else {
            selector = 'x("//*[normalize-space(text())='+this.cleanStringForXpath(item.text, true)+']")';
        }
        this.waitAndTestSelector(selector);
    };

    proto.checkHref = function(item) {
        var href = this.pyrepr(this.shortUrl(item.info.href));
        var xpath_selector = this.getLinkXPath(item);
        if(xpath_selector) {
            selector = 'x("//a['+xpath_selector+' and @href='+ href +']")';
        } else {
            selector = item.info.selector+'[href='+ href +']';
        }

        this.stmt('casper.then(function() {')
            .stmt('test.assertExists('+selector+');', 2)
            .stmt('});');
    };

    proto.checkEnabled = function(item) {
        var way = this.getControlXPath(item);
        var tag = item.info.tagName.toLowerCase();
        this.waitAndTestSelector('x("//'+tag+'[' + way + ' and not(@disabled)]")');
    };

    proto.checkDisabled = function(item) {
        var way = this.getControlXPath(item);
        var tag = item.info.tagName.toLowerCase();
        this.waitAndTestSelector('x("//'+tag+'[' + way + ' and @disabled]")');
    };

    proto.checkSelectValue = function(item) {
        var value = this.pyrepr(item.info.value);
        var way = this.getControlXPath(item);
        this.waitAndTestSelector('x("//select[' + way + ']/options[@selected and @value='+value+']")');
    };

    proto.checkSelectOptions = function(item) {
    };

    proto.checkImageSrc = function(item) {
        var src = this.pyrepr(this.shortUrl(item.info.src));
        this.waitAndTestSelector('x("//img[@src=' + src + ']")');
    };

    proto.waitAndTestSelector = function(selector) {
        this.stmt('casper.waitForSelector(' + selector + ',')
            .stmt('function success() {', 2)
            .stmt('test.assertExists(' + selector + ');', 3)
            .stmt('},', 2)
            .stmt('function fail() {', 2)
            .stmt('test.assertExists(' + selector + ');', 3)
            .stmt('});');
    };
	*/

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
