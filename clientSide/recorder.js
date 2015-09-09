(function() {

var TEXT_NODE_TYPE = 3;
//----------------------------------------------------------------------------
//Copyright (c) 2005 Zope Foundation and Contributors.

//This software is subject to the provisions of the Zope Public License,
//Version 2.1 (ZPL).  A copy of the ZPL should accompany this distribution.
//THIS SOFTWARE IS PROVIDED "AS IS" AND ANY AND ALL EXPRESS OR IMPLIED
//WARRANTIES ARE DISCLAIMED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//WARRANTIES OF TITLE, MERCHANTABILITY, AGAINST INFRINGEMENT, AND FITNESS
//FOR A PARTICULAR PURPOSE.


//VoiceCommander - a javascript library to support browser test recording. It
//is designed to be as cross-browser compatible as possible and to promote
//loose coupling with the user interface, making it easier to evolve the UI
//and experiment with alternative interfaces.

//caveats: popup windows undefined, cant handle framesets

//todo:
//- capture submit (w/lookback for doctest)
//- cleanup strings


//Contact Brian Lloyd (brian@zope.com) with questions or comments.
//---------------------------------------------------------------------------

if (typeof(VoiceCommander) == "undefined") {
    VoiceCommander = {};
}

//---------------------------------------------------------------------------
//Browser -- a singleton that provides a cross-browser API for managing event
//handlers and miscellaneous browser functions.

//Methods:

//captureEvent(window, name, handler) -- capture the named event occurring
//in the given window, setting the function handler as the event handler.
//The event name should be of the form "click", "blur", "change", etc.

//releaseEvent(window, name, handler) -- release the named event occurring
//in the given window. The event name should be of the form "click", "blur",
//"change", etc.

//getSelection(window) -- return the text currently selected, or the empty
//string if no text is currently selected in the browser.

//---------------------------------------------------------------------------

if (typeof(VoiceCommander.Browser) == "undefined") {
    VoiceCommander.Browser = {};
}
VoiceCommander.Browser.doCaptureEvent = function(wnd, name, func, frameNum) {
    var lname = name.toLowerCase();
    var doc = wnd.document;
    wnd.captureEvents(Event[name.toUpperCase()]);
    wnd["on" + lname] = func.bind(this, frameNum);
};

VoiceCommander.Browser.captureEvent = function(wnd, name, func) {
    getEveryFrameAndWindow(wnd).forEach(function(frame, i) {
        VoiceCommander.Browser.doCaptureEvent(frame, name, func, (i===0) ? false : i-1);
    });
};

VoiceCommander.Browser.doReleaseEvent = function(wnd, name, func) {
    var lname = name.toLowerCase();
    var doc = wnd.document;
    wnd.releaseEvents(Event[name.toUpperCase()]);
    wnd["on" + lname] = null;
};

VoiceCommander.Browser.releaseEvent = function(wnd, name, func) {
    getEveryFrameAndWindow(wnd).forEach(function(frame, i) {
        VoiceCommander.Browser.doReleaseEvent(frame, name, func, (i === 0) ? false : i-1);
    });
};


VoiceCommander.Browser.windowHeight = function(wnd) {
    var doc = wnd.document;
    if (wnd.innerHeight) {
        return wnd.innerHeight;
    } else if (doc.documentElement && doc.documentElement.clientHeight) {
        return doc.documentElement.clientHeight;
    } else if (document.body) {
        return document.body.clientHeight;
    } else {
        return -1;
    }
};

VoiceCommander.Browser.windowWidth = function(wnd) {
    var doc = wnd.document;
    if (wnd.innerWidth) {
        return wnd.innerWidth;
    } else if (doc.documentElement && doc.documentElement.clientWidth) {
        return doc.documentElement.clientWidth;
    } else if (document.body) {
        return document.body.clientWidth;
    } else {
        return -1;
    }
};


//---------------------------------------------------------------------------
//Event -- a class that provides a cross-browser API dealing with most of the
//interesting information about events.

//Methods:

//type() -- returns the string type of the event (e.g. "click")

//target() -- returns the target of the event

//button() -- returns the mouse button pressed during the event. Because
//it is not possible to reliably detect a middle button press, this method
//only recognized the left and right mouse buttons. Returns one of the
//constants Event.LeftButton, Event.RightButton or Event.UnknownButton for
//a left click, right click, or indeterminate (or no mouse click).

//keycode() -- returns the index code of the key pressed. Note that this
//value may differ across browsers because of character set differences.
//Whenever possible, it is suggested to use keychar() instead.

//keychar() -- returns the char version of the key pressed rather than a
//raw numeric code. The resulting value is subject to all of the vagaries
//of browsers, character encodings in use, etc.

//shiftkey() -- returns true if the shift key was pressed.

//posX() -- return the X coordinate of the mouse relative to the document.

//posY() -- return the y coordinate of the mouse relative to the document.

//stopPropagation() -- stop event propagation (if supported)

//preventDefault() -- prevent the default action (if supported)

//---------------------------------------------------------------------------

VoiceCommander.Event = function(e) {
    this.event = e || window.event;
};

var BUTTON_CODE = VOICE_COMMANDER_BUTTON_CODE,
    EVENT_CODE  = VOICE_COMMANDER_EVENT_CODE;

(function(My) {
    var proto = My.prototype;

    proto.stopPropagation = function() {
        if (this.event.stopPropagation) {
            this.event.stopPropagation();
        }
    };

    proto.preventDefault = function() {
        if (this.event.preventDefault) {
            this.event.preventDefault();
        }
    };

    proto.type = function() {
        return this.event.type;
    };

    proto.button = function() {
        if (this.event.button) {
            return this.event.button === 2 ? BUTTON_CODE.RightButton : BUTTON_CODE.LeftButton;
        } else if (this.event.which) {
            return this.event.which > 1 ? BUTTON_CODE.RightButton : BUTTON_CODE.LeftButton;
        } else {
            return BUTTON_CODE.UnknownButton;
        }
    };

    proto.target = function() {
        var t = (this.event.target) ? this.event.target : this.event.srcElement;
        if (t && t.nodeType == 3) { // safari bug
            return t.parentNode;
        } else {
            return t;
        }
    };

    proto.keycode = function() {
        return (this.event.keyCode) ? this.event.keyCode : this.event.which;
    };

    proto.keychar = function() {
        return String.fromCharCode(this.keycode());
    };

    proto.shiftkey = function() {
        return this.event.shiftKey;
    };

    proto.posX = function() {
        if (this.event.pageX) {
            return this.event.pageX;
        } else if (this.event.clientX) {
            return this.event.clientX + document.body.scrollLeft;
        } else {
            return 0;
        }
    };

    proto.posY = function() {
        if (this.event.pageY) {
            return this.event.pageY;
        } else if (this.event.clientY) {
            return this.event.clientY + document.body.scrollTop;
        } else {
            return 0;
        }
    };
}(VoiceCommander.Event));

//---------------------------------------------------------------------------
//Macro -- this class contains the interesting events that happen in
//the course of a test recording and provides some Macro metadata.

//Attributes:

//title -- the title of the test case.

//items -- an array of objects representing test actions and checks


//---------------------------------------------------------------------------

VoiceCommander.Macro = function() {
    // maybe some items are already stored in the background
    // but we do not need them here anyway
    this.items = [];
};

(function(My) {
    var proto = My.prototype;

    proto.append = function(o, otherData) {
        return new Promise(function(resolve) {
            this.items.push(o);
            chrome.runtime.sendMessage(_.extend({
                action: 'append',
                obj: o
            }, otherData), function(uid) {
                resolve(uid);
            });
        }.bind(this));
    };

    proto.attachImage = function(uid, dataURI) {
        chrome.runtime.sendMessage({
            action: 'attach_image',
            uid: uid,
            dataURI: dataURI
        });
    };

    proto.peek = function() {
        return this.items[this.items.length - 1];
    };

    proto.poke = function(o) {
        this.items[this.items.length - 1] = o;
        chrome.runtime.sendMessage({action: "poke", obj: o});
    };
}(VoiceCommander.Macro));


//---------------------------------------------------------------------------
//Event types -- whenever an interesting event happens (an action or a check)
//it is recorded as one of the object types defined below. All events have a
//'type' attribute that marks the type of the event (one of the values in the
//EventTypes enumeration) and different attributes to capture the pertinent
//information at the time of the event.
//---------------------------------------------------------------------------

VoiceCommander.ElementInfo = function(element) {
    if(element.nodeType === TEXT_NODE_TYPE) {
        element = element.parentNode;
    }

    this.action = element.action;
    this.method = element.method;
    this.href = element.href;
    this.tagName = element.tagName;
    this.selector = this.getCleanCSSSelector(element);
    this.value = element.value;
    this.checked = element.checked;
    this.name = element.name;
    this.type = element.type;
    if (this.type) {
        this.type = this.type.toLowerCase();
    }
    if (element.form) {
        this.form = {id: element.form.id, name: element.form.name};
    }
    this.src = element.src;
    this.id = element.id;
    this.title = element.title;
    this.options = [];
    if (element.selectedIndex) {
        for (var i=0; i < element.options.length; i++) {
            var o = element.options[i];
            this.options[i] = {text:o.text, value:o.value};
        }
    }
    this.label = this.findLabelText(element);
};

(function(My) {
    var proto = My.prototype;

    proto.findLabelText = function(element) {
        var label = this.findContainingLabel(element) ||
                    this.findReferencingLabel(element);

        if (label) {
            return label.innerHTML
                        // remove newlines
                        .replace('\n', ' ')
                        // remove tags
                        .replace(/<[^>]*>/g, ' ')
                        // remove non-alphanumeric prefixes or suffixes
                        .replace(/^\W*/mg, '')
                        .replace(/\W*$/mg, '')
                        // remove extra whitespace
                        .replace(/^\s*/, '')
                        .replace(/\s*$/, '')
                        .replace(/\s+/g, ' ');
        } else {
            return false;
        }
    };

    proto.findReferencingLabel = function(element) {
        var labels = window.document.getElementsByTagName('label')
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].attributes['for'] &&
                    labels[i].attributes['for'].value == element.id) {
                return labels[i];
            }
        }
    };

    proto.findContainingLabel = function(element) {
        var parent = element.parentNode;
        if (!parent) {
            return undefined;
        } else if (parent.tagName && parent.tagName.toLowerCase() == 'label') {
            return parent;
        } else {
            return this.findContainingLabel(parent);
        }
    }

    proto.getSelectorAccuracy = function(selector) {
        return document.querySelectorAll(selector).length;
    };

    proto.getCleanCSSSelector = function(element) {
        if(!element) {
            return;
        }

        var selector = element.tagName ? element.tagName.toLowerCase() : '';
        if(selector == '' || selector == 'html') return '';

        var tmp_selector = '';
        var accuracy = this.getSelectorAccuracy(selector);
        if(element.id) {
            selector = "#" + element.id.replace(/\./g, '\\.');
            accuracy = this.getSelectorAccuracy(selector);
            if(accuracy===1) {
                return selector;
            }
        }
        if(element.className) {
            tmp_selector = '.' + element.className.trim().replace(/ /g,".");
            if(this.getSelectorAccuracy(tmp_selector) < accuracy) {
                selector = tmp_selector;
                accuracy = this.getSelectorAccuracy(selector);
                if(accuracy===1) {
                    return selector;
                }
            }
        }
        var parent = element.parentNode;
        var parent_selector = this.getCleanCSSSelector(parent);

        if(parent_selector) {

            // resolve sibling ambiguity
            var matching_sibling = 0;
            var matching_nodes = document.querySelectorAll(parent_selector + ' > ' + selector);
            for(var i=0; i<matching_nodes.length;i++) {
                if(matching_nodes[i].parentNode === parent) matching_sibling++;
            }
            if(matching_sibling > 1) {
                var index = 1;
                for (var sibling = element.previousElementSibling; sibling; sibling = sibling.previousElementSibling) index++;
                selector = selector + ':nth-child(' + index + ')';
            }

            // remove useless intermediary parent
            selector_array = parent_selector.split(' ');
            if(selector_array.length>1) {
                for(var i=1;i<selector_array.length;i++) {
                    tmp_selector = selector_array.slice(0,i).join(' ') + ' ' + selector;
                    if(this.getSelectorAccuracy(tmp_selector) === 1) {
                        selector = tmp_selector;
                        break;
                    }
                }
            }

            // improve accuracy if still not correct
            accuracy = this.getSelectorAccuracy(selector);
            if(accuracy>1) {
                tmp_selector = parent_selector + " " + selector;
                if(this.getSelectorAccuracy(tmp_selector) === 1) {
                    selector = tmp_selector;
                } else {
                    selector = parent_selector + " > " + selector;
                }
            }
        }

        return selector;
    }
}(VoiceCommander.ElementInfo));

VoiceCommander.DocumentEvent = function(type, target) {
    this.type = type;
    this.url = target.URL;
    this.title = target.title;
}

VoiceCommander.ElementEvent = function(type, target, options) {
    this.type = type;
    this.info = new VoiceCommander.ElementInfo(target);
    for(var key in options) {
        if(options.hasOwnProperty(key)) {
            var value = options[key];
            this[key] = value;
        }
    }
}

VoiceCommander.SelectionEvent = function(type, selection, options) {
    this.type = type;
    var range = selection.getRangeAt(0);
    this.startContainerInfo = new VoiceCommander.ElementInfo(range.startContainer);
    this.endContainerInfo = new VoiceCommander.ElementInfo(range.endContainer);
    this.commonAncestorContainer = new VoiceCommander.ElementInfo(range.commonAncestorContainer);
    this.startOffset = range.startOffset;
    this.endOffset = range.endOffset;

    _.extend(this, options);
}

VoiceCommander.CommentEvent = function(text) {
    this.type = EVENT_CODE.Comment;
    this.text = text;
}

VoiceCommander.KeyEvent = function(target, text, options) {
    this.type = EVENT_CODE.KeyPress;
    this.info = new VoiceCommander.ElementInfo(target);
    this.text = text;

    _.extend(this, options);
}

VoiceCommander.MouseEvent = function(type, target, x, y, options) {
    this.type = type;
    this.info = new VoiceCommander.ElementInfo(target);
    this.x = x;
    this.y = y;

    _.extend(this, options);
}

VoiceCommander.ScreenShotEvent = function() {
    this.type = EVENT_CODE.ScreenShot;
}

VoiceCommander.OpenURLEvent = function(url) {
    this.type = EVENT_CODE.OpenUrl;
    this.url = url;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
}

VoiceCommander.PageLoadEvent = function(url) {
    this.type = EVENT_CODE.OpenUrl;
    this.url = url;
    this.viaBack = back
}

//---------------------------------------------------------------------------
//Recorder -- a controller class that manages the recording of web browser
//activities to produce a test case.

//Instance Methods:

//start() -- start recording browser events.

//stop() -- stop recording browser events.

//reset() -- reset the recorder and initialize a new test case.

//---------------------------------------------------------------------------

VoiceCommander.Recorder = function() {
    this.macro = new VoiceCommander.Macro();
    this.logfunc = null;
    this.window = null;
    this.active = false;
};

//The recorder is a singleton -- there is no real reason to have more than
//one instance, and many of its methods are event handlers which need a
//stable reference to the instance.

recorder = new VoiceCommander.Recorder();
recorder.logfunc = function(msg) { console.log(msg); };

(function(My) {
    var proto = My.prototype;

    proto.start = function() {
        var url = window.location.href;
        this.open(url);

        this.window = window;
        this.captureEvents();

        // OVERRIDE stopPropagation
        var actualCode = '(' + function() {
            var overloadStopPropagation = Event.prototype.stopPropagation;
            Event.prototype.stopPropagation = function(){
                overloadStopPropagation.apply(this, arguments);
            };
        } + ')();';
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head||document.documentElement).appendChild(script);
        script.parentNode.removeChild(script);

        this.active = true;
        //this.log("recorder started");
    };

    proto.stop = function() {
        this.releaseEvents();
        this.active = false;
        //this.log("recorder stopped");
    };

    proto.open = function(url) {
        var e = new VoiceCommander.OpenURLEvent(url);
        this.macro.append(e);
        //this.log("open url: " + url);
    };

    proto.pageLoad = function() {
        var doc = recorder.window.document;
        var e = new VoiceCommander.DocumentEvent(EVENT_CODE.PageLoad, doc);
        this.macro.append(e);
        //this.log("page loaded url: " + e.url);
    };

    var eventTypes = ['drag', 'mousedown',
                        'mouseup', 'click', 'change',
                        'keypress', 'select', 'submit'];

    proto.captureEvents = function() {
        var wnd = this.window;
        eventTypes.forEach(function(eventType) {
            VoiceCommander.Browser.captureEvent(wnd, eventType, this['on'+eventType]);
        }.bind(this));
    };

    proto.releaseEvents = function() {
        var wnd = this.window;
        eventTypes.forEach(function(eventType) {
            VoiceCommander.Browser.releaseEvent(wnd, eventType, this['on'+eventType]);
        }.bind(this));
    };



    proto.clickaction = function(frameNum, e) {
        var target = e.target();
        // This method is called by our low-level event handler when the mouse
        // is clicked in normal mode. Its job is decide whether the click is
        // something we care about. If so, we record the event in the test case.
        //
        // If the context menu is visible, then the click is either over the
        // menu (selecting a check) or out of the menu (cancelling it) so we
        // always discard clicks that happen when the menu is visible.
        var type = target.type;
        var imageDataPromise = getImageData(target);
        if (target.href || (type && type == "submit") ||
                (type && type == "submit")) {
            this.macro.append(new VoiceCommander.ElementEvent(EVENT_CODE.Click, target, {frameNum: frameNum}));
        } else {
            var posX = e.posX,
                posY = e.posY();

            recorder.macro.append(
                    new VoiceCommander.MouseEvent(
                            EVENT_CODE.Click, target, posX, posY
                    ), {frameNum: frameNum}).then(function(uid) {
                        imageDataPromise.then(function(dataURL) {
                            console.log('attach');
                            recorder.macro.attachImage(uid, dataURL);
                        });
                    });
        }
    };

    proto.addComment = function(text) {
        this.macro.append(new VoiceCommander.CommentEvent(text));
    };

/*
    proto.check = function(e) {
        // This method is called by our low-level event handler when the mouse
        // is clicked in check mode. Its job is decide whether the click is
        // something we care about. If so, we record the check in the test case.
        contextmenu.show(e);
        var target = e.target();
        if (target.type) {
            var type = target.type.toLowerCase();
            if (type == "submit" || type == "button" || type == "image") {
                recorder.log('check button == "' + target.value + '"');
            }
        } else if (target.href && target.innerText) {
            var text = recorder.strip(target.innerText);
            recorder.log('check link == "' + target.text + '"');
        }
    };
    */

    proto.onpageload = function() {
        if (this.active) {
            // This must be called each time a new document is fully loaded into the
            // testing target frame to ensure that events are captured for the page.
            recorder.captureEvents();

            // if a new page has loaded, but there doesn't seem to be a reason why,
            // then we need to record the fact or the information will be lost
            if (this.macro.peek()) {
                var last_event_type = this.macro.peek().type;
                if (last_event_type != EVENT_CODE.OpenUrl &&
                        last_event_type != EVENT_CODE.Click &&
                        last_event_type != EVENT_CODE.Submit) {
                    this.open(this.window.location.toString());
                }
            }

            // record the fact that a page load happened
            if (this.window) {
                this.pageLoad();
            }
        }
    };

    proto.onchange = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        var v = new VoiceCommander.ElementEvent(EVENT_CODE.Change, e.target(), {
            frameNum: frameNum
        });
        recorder.macro.append(v);
        recorder.log("value changed: " + e.target().value);
    };

    proto.onselect = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        recorder.log("select: " + e.target());
    };

    proto.onsubmit = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        // We want to save the form element as the event target
        var t = e.target();
        while (t.parentNode && t.tagName != "FORM") {
            t = t.parentNode;
        }
        var v = new VoiceCommander.ElementEvent(EVENT_CODE.Submit, t, {
            frameNum: frameNum
        });
        recorder.macro.append(v);
        recorder.log("submit: " + e.target());
    };

    proto.ondrag = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        recorder.macro.append(
                new VoiceCommander.MouseEvent(
                        EVENT_CODE.MouseDrag, e.target(), e.posX(), e.posY(), {
                            frameNum: frameNum
                        }
                ));
    };
    proto.onmousedown = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        if (e.button() == BUTTON_CODE.LeftButton) {
            recorder.macro.append(
                new VoiceCommander.MouseEvent(
                        EVENT_CODE.MouseDown, e.target(), e.posX(), e.posY(), {
                            frameNum: frameNum
                        }
                ));
        }
    };
    proto.onmouseup = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);
        if (e.button() == BUTTON_CODE.LeftButton) {
            recorder.macro.append(
                    new VoiceCommander.MouseEvent(
                            EVENT_CODE.MouseUp, e.target(), e.posX(), e.posY(), {
                                frameNum: frameNum
                            }
                    ));
        }
    };
    //The dance here between onclick and oncontextmenu requires a bit of
    //explanation. IE and Moz/Firefox have wildly different behaviors when
    //a right-click occurs. IE6 fires only an oncontextmenu event; Firefox
    //gets an onclick event first followed by an oncontextment event. So
    //to do the right thing here, we need to silently consume oncontextmenu
    //on Firefox, and reroute oncontextmenu to look like a click event for
    //IE. In both cases, we need to prevent the default action for cmenu.

    proto.onclick = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);

        if (e.shiftkey()) {
            //recorder.check(e);
            e.stopPropagation();
            e.preventDefault();
            return false;
        }

        if (e.button() == BUTTON_CODE.RightButton) {
            //recorder.check(e);
            return true;
        } else if (e.button() == BUTTON_CODE.LeftButton) {
            recorder.clickaction(e);
            return true;
        }
        e.stopPropagation();
        e.preventDefault();
        return false;
    };
    /*

    proto.oncontextmenu = function(e) {
        var e = new VoiceCommander.Event(e);
        //recorder.check(e);
        e.stopPropagation();
        e.preventDefault();
        return false;
    };
    */

    proto.onkeypress = function(frameNum, e) {
        var e = new VoiceCommander.Event(e);

        var last = recorder.macro.peek();
        if(last.type == EVENT_CODE.KeyPress) {
            last.text = last.text + e.keychar();
            recorder.macro.poke(last);
        } else {
            recorder.macro.append(
                new VoiceCommander.KeyEvent(e.target(), e.keychar(), {
                    frameNum: frameNum
                })
            );
        }
        return true;
    };

    proto.strip = function(s) {
        return s.replace('\n', ' ').replace(/^\s*/, "").replace(/\s*$/, "");
    };

    proto.log = function(text) {
        if (this.logfunc) {
            this.logfunc(text);
        }
    };
}(VoiceCommander.Recorder));

function getEveryFrameAndWindow(wnd) {
    if(!wnd) { wnd = window;}

    var rv = [wnd];
    var frames = wnd.frames,
        numFrames = frames.length;

    for(var i = 0; i<numFrames; i++) {
        rv.push(frames[i]);
    }
    return rv;
}
function getFrameAwareSelection() {
    var frames = getEveryFrameAndWindow();
    var frame, selection, frameNum;

    for(var i = 0; i<frames.length; i++) {
        frame = frames[i];
        frameNum = (i === 0) ? false : i-1;
        selection = frame.getSelection();

        if(selection.type === 'Range') {
            break;
        }
    }

    return {
        selection: selection,
        frameNum: frameNum
    };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var action = request.action;
    if (action == 'started') {
        recorder.start();
        sendResponse({});
    } else if (action == 'stopped') {
        recorder.stop();
        sendResponse({});
    } else if (action === 'tts_element') {
        var selectionInfo = getFrameAwareSelection();
        var e = new VoiceCommander.SelectionEvent(EVENT_CODE.ReadElement, selectionInfo.selection, {
            frameNum: selectionInfo.frameNum
        });
        recorder.macro.append(e);
    } else if(action === 'clickWhen') {
        var element = document.elementFromPoint(mouseLocation.x, mouseLocation.y);
        var e = new VoiceCommander.ElementEvent(EVENT_CODE.ClickWhen, element, {
            var_name: request.var_name,
            value: request.value
        });

        recorder.macro.append(e);
    } else if(action === 'setVarValueToSelection') {
        var selectionInfo = getFrameAwareSelection();
        var e = new VoiceCommander.SelectionEvent(EVENT_CODE.SetVarValue, selectionInfo.selection, {
            var_name: request.var_name,
            frameNum: selectionInfo.frameNum
        });

        recorder.macro.append(e);
    } else if(action === 'typeVarValue') {
        var selectionInfo = getFrameAwareSelection();
        var e = new VoiceCommander.SelectionEvent(EVENT_CODE.SetVarValue, selectionInfo.selection, {
            var_name: request.var_name,
            frameNum: selectionInfo.frameNum
        });

        recorder.macro.append(e);
    } else if(action === 'enterVar') {
    } else {
        //console.log(action);
        //console.log(request);
    }
});

//get current status from background
chrome.runtime.sendMessage({action: "get_status"}, function(response) {
    if (response.isRecording) {
        recorder.start();
    }
});

var mouseLocation = {x: -1, y: -1};
window.addEventListener('mousemove', function(event) {
    mouseLocation.x = event.pageX;
    mouseLocation.y = event.pageY;
});

function getImageData(element) {
    return new Promise(function(resolve, reject) {
        html2canvas(element, {
            onrendered: function(canvas) {
                resolve(canvas.toDataURL());
            }
        })
    });
}

}());
