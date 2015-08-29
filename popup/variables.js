$.widget('voice_commander.variableListDisplay', {
	options: {
		instructionsText: 'Voice Commander is currently recording your actions in Chrome (such as clicks and keypresses). These actions will help write an automated command script. They will not be shared.'
	},
	_create: function() {
		this._refresh();
		this._variableDisplays = $('<div />').appendTo(this.element);
		this._variableDisplayMap = {};
	},
	_destroy: function() {
		this._variableDisplays.children().each(function(variable) {
			variable.variable("destroy").remove();
		});
	},

	_refresh: function() {
		getVariables().then($.proxy(this._doRefresh, this));
	},
	_doRefresh: function(variables) {
		$.each(variables, function(key, value) {
			this._variableDisplays.append(this._getVariableDisplay(key, value));
		});
	},
	_getVariableDisplay: function(key, value) {
		if(this._variableDisplayMap.hasOwnProperty(key)) {
			return this._variableDisplayMap[key];
		} else {
			var element = $('<span />').variable({
				name: key,
				value: value
			});

			this._variableDisplayMap[key] = element;

			return element;
		}
	}
});

$.widget('voice_commander.variable', {
	options: {
		name: false,
		value: false,
		type: false
	},
	_create: function() {
		this.nameDisplay = $('<span />').appendTo(this.element);
		this.valueDisplay = $('<span />').appendTo(this.element);

		this._doUpdateNameDisplay(this.option('name'));
		this._doUpdateValueDisplay(this.option('value'));
		this._doUpdateTypeDisplay(this.option('type'));
	},
	_destroy: function() {

	},
	_setOption: function(key, value) {
		this._super(key, value);
		if(key === 'name') {
			this._doUpdateNameDisplay(value);
		} else if(key === 'value') {
			this._doUpdateValueDisplay(value);
		} else if(key === 'type') {
			this._doUpdateTypeDisplay(value);
		}
	},
	_doUpdateNameDisplay: function(name) {
		this.nameDisplay.text(name);
	},
	_doUpdateValueDisplay: function(value) {
		this.valueDisplay.text(value);
	},
	_doUpdateTypeDisplay: function(type) {

	}
})
