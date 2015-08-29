$.widget('voice_commander.variableListDisplay', {
	options: {
		instructionsText: 'Voice Commander is currently recording your actions in Chrome (such as clicks and keypresses). These actions will help write an automated command script. They will not be shared.'
	},
	_create: function() {
		this._titleContainer = $('<div />')	.addClass('mdl-card__title')
											.appendTo(this.element);

		this._titleText = $('<h2 />')	.addClass('mdl-card__title-text')
										.appendTo(this._titleContainer);

		this._instructionDisplay = $('<div />')	.addClass('mdl-card__supporting-text')
												.text(this.option('instructionsText'))
												.appendTo(this.element);

		this._variableDisplays = $('<div />')	.appendTo(this.element)
												.addClass('variable-display');

		this._stopRecordingButton = $('<a />')	.appendTo(this.element)
												.addClass('mdl-button mdl-button--colored')
												.addClass('mdl-js-button mdl-js-ripple-effect')
												.on('click', requestStop)
												.text("I'm Done");

		this._refresh();

		this._variableDisplayMap = {};

		chrome.runtime.onMessage.addListener($.proxy(function(request, sender, sendResponse) {
			if(request.action === 'varChanged') {
				this._refresh();
			}
		}, this));
	},
	_destroy: function() {
		this._variableDisplays.children().each(function(varDisplay) {
			console.log(varDisplay);
			$(varDisplay).variable("destroy").remove();
		});
		this.element.children().remove();
	},

	_refresh: function() {
		getVariables().then($.proxy(this._doRefresh, this));
	},
	_doRefresh: function(variables) {
		if(_.isEmpty(variables)) {
			this._titleText.text('Recording');
			this._instructionDisplay.show();
			this._variableDisplays.hide();
		} else {
			this._titleText.text('Variables');
			this._instructionDisplay.hide();
			this._variableDisplays.show();
			_.each(variables, function(value, key) {
				this._variableDisplays.append(this._getVariableDisplay(key, value));
			}, this);
		}
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
		this.nameDisplay = $('<span />').appendTo(this.element)
										.addClass('var-name')
										.editableText({})
										.on('textChange', $.proxy(function(event) {
											var oldName = this.option('name'),
												newName = event.value;
											changeVarName(oldName, newName);
										}, this));
		this.valueDisplay = $('<span />')	.appendTo(this.element)
											.addClass('var-value')
											.editableText({})
											.on('textChange', $.proxy(function(event) {
												var oldValue = this.option('value'),
													newValue = event.value;
												changeVarValue(oldValue, newValue);
											}, this));

		this._doUpdateNameDisplay(this.option('name'));
		this._doUpdateValueDisplay(this.option('value'));
		this._doUpdateTypeDisplay(this.option('type'));

		this.element.addClass('vc-var');
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
		this.nameDisplay.editableText('option', 'value', name);
	},
	_doUpdateValueDisplay: function(value) {
		this.valueDisplay.editableText('option', 'value', value);
	},
	_doUpdateTypeDisplay: function(type) {

	}
})
