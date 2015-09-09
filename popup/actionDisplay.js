$.widget('voice_commander.actionDisplay', {
	options: {

	},

	_create: function() {
		this.refresh();
		this.actionList = $('<div />').appendTo(this.element);

		this.$_onRuntimeMessage = $.proxy(this._onRuntimeMessage, this);

		chrome.runtime.onMessage.addListener(this.$_onRuntimeMessage);

		this._itemDisplayMap = new UniqueChildTracker(function(value, key) {
			return $('<div />').step({
				action: value
			});
		}, function(action, index) {
			return action.uid;
		});
	},

	_destroy: function() {
		this.actionList.children().each(function(i, child) {
			$(child).step('destroy').remove();
		});
		this.element.children().remove();

		chrome.runtime.onMessage.removeListener(this.$_onRuntimeMessage);
	},

	_onRuntimeMessage: function(request, sender, sendResponse) {
		var action = request.action;
		if(action === 'append') {
			this.refresh();
		} else if(action === 'stepChanged') {
			if(this._itemDisplayMap.hasChildView(request.uid)) {
				var childView = this._itemDisplayMap.getChildView(action.uid);
				childView.step('option', 'action', request.step);
			}
		}
	},

	refresh: function() {
		getStatus().then(function(status) {
			if(status.isRecording) {
				return getActions();
			} else {
				return false;
			}
		}).then(function (actions) {
			return _.filter(actions, function(action) {
				return getDisplayTypeName(action.type);
			});
		}).then(function(displayableActions) {
			return _.filter(displayableActions, function(action, index) {
				var type = action.type;
				if(type === ECODE.Click && displayableActions[index+1] && displayableActions[index+1].type === ECODE.OpenUrl) {
					return false;
				}
				return true;
			});
		}).then(function (displayableActions) {
			this._itemDisplayMap.setChildren(displayableActions).then(_.bind(function(info) {
				var toRemove = info.toRemove,
					childViews = info.childViews;

				_.each(toRemove, function(childView) {
					childView.step('destroy').remove();
				}, this);

				_.each(childViews, function(childView, index) {
					this.actionList.append(childView);
					childView.step('option', {
						index: index+1,
						action: displayableActions[index]
					});
				}, this);
			}, this));
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

		display.step('option', {
			index: index,
			action: action
		});

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

function getDisplayTypeName(type) {
	if(type === ECODE.OpenUrl) {
		return 'gotoDisplay';
	} else if(type === ECODE.Click) {
		return 'clickDisplay';
	} else {
		return false;
	}
}

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
		var displayTypeName = getDisplayTypeName(this.option('action').type);

		if(displayTypeName) {
			this.stepDisplay[displayTypeName]('destroy');
		}

		this.stepNumberDisplay.stepNumberDisplay('destroy');
	},
	_setOption: function(key, value) {
		this._super(key, value);

		if(key === 'index') {
			this.stepNumberDisplay.stepNumberDisplay('option', key, value);
		} else if(key === 'action') {
			var displayTypeName = getDisplayTypeName(this.option('action').type);

			if(displayTypeName) {
				this.stepDisplay[displayTypeName]('option', key, value);
			}
		}
	},
	_updateActionDisplay: function() {
		var action = this.option('action'),
			type = action.type,
			displayTypeName = getDisplayTypeName(type),
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
