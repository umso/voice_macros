$.widget('voice_commander.variableListDisplay', {
	options: {
		variableInstructionsText: 'Commands can have variables, which are changeable parameters of the command.'
	},
	_create: function() {
		this._titleContainer = $('<div />')	.addClass('mdl-card__title')
											.appendTo(this.element);

		this._titleText = $('<h2 />')	.addClass('mdl-card__title-text')
										.appendTo(this._titleContainer)
										.macroName({});

		this._variableDisplays = $('<div />')	.appendTo(this.element)
												.addClass('variable-display');

		/*instructionsText: 'Voice Commander is currently recording your actions in Chrome (such as clicks and keypresses). These actions will help write an automated command script. They will not be shared.',
		this._instructionDisplay = $('<p />')	.addClass('mdl-card__supporting-text variableInstructions')
												.text(this.option('instructionsText'))
												.appendTo(this._variableDisplays);
												*/

		this._variableInstructions = $('<p />')	.appendTo(this._variableDisplays)
												.addClass('mdl-card__supporting-text variableInstructions')
												.text(this.option('variableInstructionsText'))
												.css({
													'margin-bottom': '0px'
												});

		this._variableList = $('<div />')	.appendTo(this._variableDisplays)
											.addClass('variable-display');

		this._addVariableDisplay = $('<a />')	.addClass('mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect')
												.appendTo(this._variableList)
												.text('Add Variable')
												.on('click', $.proxy(function() {
													addVariable().then(_.bind(this._doRefresh, this));
												}, this));

		this._refresh();

		this._variableDisplayMap = new UniqueChildTracker(function(value, key) {
			return $('<span />').variable({
				name: key,
				value: value
			});
		});

		chrome.runtime.onMessage.addListener($.proxy(function(request, sender, sendResponse) {
			if(request.action === 'varChanged') {
				this._refresh();
			}
		}, this));
	},
	_destroy: function() {
		this._addVariableDisplay.remove();
		this._variableList.children().each(function(varDisplay) {
			$(this).variable("destroy").remove();
		});
		this._titleText.macroName('destroy').remove();
		this.element.children().remove();
	},

	_refresh: function() {
		getVariables().then($.proxy(this._doRefresh, this));
	},
	_doRefresh: function(variables) {
		this._variableDisplayMap.setChildren(variables).then(_.bind(function(info){
			var toRemove = info.toRemove,
				childViews = info.childViews;

			_.each(toRemove, function(childView) {
				childView.variable('destroy').remove();
			}, this);

			_.each(childViews, function(childView) {
				var name = childView.variable('option', 'name');
				this._variableList.append(childView);
				childView.variable('option', 'highlightClass', getVariableIndex(variables, name));
			}, this);
			this._addVariableDisplay.appendTo(this._variableList);
		}, this));
		if(_.isEmpty(variables)) {
			this.element.addClass('instructions');
			//this._instructionDisplay.show();
			this._variableInstructions.show();
		} else {
			this.element.removeClass('instructions');
			//this._instructionDisplay.hide();
			this._variableInstructions.hide();
		}
	}
});

$.widget('voice_commander.variable', {
	options: {
		name: false,
		value: false,
		type: false,
		highlightClass: 0
	},
	_create: function() {
		this.nameDisplay = $('<span />').appendTo(this.element)
										.addClass('var-name')
										.editableText({})
										.on('textChange', $.proxy(function(event) {
											var oldName = this.option('name'),
												newName = event.value.trim();
											if(newName) {
												changeVarName(oldName, newName);
											} else {
												removeVariable(oldName);
											}
										}, this));
		this.valueDisplay = $('<span />')	.appendTo(this.element)
											.addClass('var-value')
											.editableText({})
											.on('textChange', $.proxy(function(event) {
												var name = this.option('name'),
													newValue = event.value.trim();
												changeVarValue(name, newValue);
											}, this));

		this._doUpdateNameDisplay(this.option('name'));
		this._doUpdateValueDisplay(this.option('value'));
		this._doUpdateTypeDisplay(this.option('type'));
		this._doUpdateClass(this.option('highlightClass'));

		this.element.addClass('vc-var');
	},
	_destroy: function() {

	},
	_setOption: function(key, value) {
		var oldValue;
		if(key === 'highlightClass') {
			oldValue = this.option(key);
		}

		this._super(key, value);

		if(key === 'name') {
			this._doUpdateNameDisplay(value);
		} else if(key === 'value') {
			this._doUpdateValueDisplay(value);
		} else if(key === 'type') {
			this._doUpdateTypeDisplay(value);
		} else if(key === 'highlightClass') {
			this._doUpdateClass(value, oldValue);
		}
	},
	_doUpdateNameDisplay: function(name) {
		this.nameDisplay.editableText('option', 'value', name);
	},
	_doUpdateValueDisplay: function(value) {
		this.valueDisplay.editableText('option', 'value', value);
	},
	_doUpdateTypeDisplay: function(type) {

	},
	_doUpdateClass: function(classNum, oldClass) {
		if(_.isNumber(oldClass)) {
			this.nameDisplay.removeClass('highlight'+oldClass);
		}
		this.nameDisplay.addClass('highlight highlight'+classNum);

		_.delay(_.bind(function() {
			if(!this.nameDisplay || !this.valueDisplay) { return ; }

			this.nameDisplay.add(this.valueDisplay)
							.css({
								'border': '2px solid ' + this.nameDisplay.css('background-color')
							});
			this.nameDisplay.css('border-right', 'none');
			this.valueDisplay.css('border-left', 'none');
		}, this), 0);
	}
})
