$.widget('voice_commander.actionDisplay', {
	options: {

	},

	_create: function() {
		this.itemDisplays = {};
		this.refresh();
		this.actionList = $('<div />').appendTo(this.element);
	},

	_destroy: function() {

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
				recording.forEach(function(action) {
					var display = this._getDisplay(action);
					this.actionList.append(display);
				}.bind(this));
			} else {
			}
		}.bind(this));
	},

	_getDisplay: function(action) {
		var uid = action.uid,
			type = action.type;

		if(this.itemDisplays.hasOwnProperty(uid)) {
			return this.itemDisplays[uid];
		} else {
			var display = $('<div />');
			if(type === VOICE_COMMANDER_EVENT_CODE.OpenUrl) {
				display.gotoDisplay({
					action: action
				});
			} else if(type === VOICE_COMMANDER_EVENT_CODE.Click) {
				display.clickDisplay({
					action: action
				});
			}

			this.itemDisplays[uid] = display;
			return display;
		}
	}
});
