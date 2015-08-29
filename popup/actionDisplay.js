$.widget('voice_commander.actionDisplay', {
	options: {

	},

	_create: function() {
		this.itemDisplays = {};
		this.refresh();
		this.actionList = $('<div />').appendTo(this.element);

		chrome.runtime.onMessage.addListener($.proxy(function(request, sender, sendResponse) {
			var action = request.action;
			if(action === 'append') {
				this.refresh();
			}
		}, this));
	},

	_destroy: function() {
		this.actionList.children().each(function(i, child) {
			$(child).step('destroy').remove();
		});
		this.element.children().remove();
	},

	refresh: function() {
		getStatus().then(function(status) {
			if(status.isRecording) {
				return getCurrentRecording();
			} else {
				return false;
			}
		}).then(function (recording) {
			if(recording) {
				recording.forEach(function(action, index) {
					var display = this._getDisplay(action, index+1);
					this.actionList.append(display);
				}.bind(this));
			}
		}.bind(this));
	},

	_getDisplay: function(action, index) {
		var uid = action.uid,
			type = action.type,
			display;

		if(this.itemDisplays.hasOwnProperty(uid)) {
			display = this.itemDisplays[uid];
		} else {
			display = $('<div />').step({
				action: action
			});

			this.itemDisplays[uid] = display;
		}

		display.step('option', 'index', index);

		return display;
	}
});

$.widget('voice_commander.stepNumberDisplay', {
	options: {
		index: -1
	},
	_create: function() {
		this.element.addClass('step_number');
		this.numElement = $('<p />').appendTo(this.element)
										.addClass('num')
										.text(this.option('index'));
	},
	_destroy: function() {
		this.element.removeClass('step_number');
	},
	_setOption: function(key, value) {
		if(key == 'index') {
			this.numElement.text(''+value);
		}
		this._super(key, value);
	}
});


var ECODE = VOICE_COMMANDER_EVENT_CODE;

$.widget('voice_commander.step', {
	options: {
		action: false,
		index: -1
	},
	_create: function() {
		this.stepNumberDisplay = $('<span />').appendTo(this.element).stepNumberDisplay();
		this.stepDisplay = $('<span />').appendTo(this.element);

		this.element.addClass('step');

		this._updateActionDisplay();
	},
	_destroy: function() {
		var displayTypeName = this._getDisplayTypeName(this.option('action').type);

		this.stepNumberDisplay.stepNumberDisplay('destroy');
	},
	_setOption: function(key, value) {
		if(key == 'index') {
			this.stepNumberDisplay.stepNumberDisplay('option', key, value);
		}
		this._super(key, value);
	},
	_getDisplayTypeName: function(type) {
		if(type === ECODE.OpenUrl) {
			return 'gotoDisplay';
		} else if(type === ECODE.Click) {
			return 'clickDisplay';
		} else {
			return false;
		}
	},
	_updateActionDisplay: function() {
		var action = this.option('action'),
			type = action.type,
			displayTypeName = this._getDisplayTypeName(type),
			display = this.stepDisplay;

		if(displayTypeName) {
			display[displayTypeName]({
				action: action
			});
		} else {
			for(var key in ECODE) {
				if(ECODE.hasOwnProperty(key)) {
					var value = ECODE[key];

					if(value === type) {
						display.text('<'+key+'>');
						break;
					}
				}
			}
		}
	}
});
