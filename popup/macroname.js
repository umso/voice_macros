$.widget('voice_commander.macroName', {
	options: {
		name: '',
		editingName: '',
		varNames: {}
	},
	_create: function() {
		this.element.editableText({
						updateOwnValue: false,
						getDisplay: $.proxy(this._getDisplay, this),
						getEditingValue: $.proxy(this._getEditingName, this)
					})
					.on('textChange', function(event) {
						postNewName(event.value);
					});

		this.$_onRuntimeMessage = $.proxy(this._onRuntimeMessage, this);
		chrome.runtime.onMessage.addListener(this.$_onRuntimeMessage);
		this.fullRefresh();
	},

	_onRuntimeMessage: function(request, sender, sendResponse) {
		var action = request.action;

		if(action === 'nameMacro') {
			this.fullRefresh();
		} else if(action === 'varChanged') {
			this.fullRefresh();
		}
	},

	_refreshDisplay: function() {
		this.element.editableText('refreshDisplay');
	},

	fullRefresh: function() {
		Promise.all([getName(), getDisplayName()]).then($.proxy(function(infos) {
			var nameInfo = infos[0],
				displayName = infos[1];

			this.option(_.extend({
				editingName: displayName
			}, nameInfo));
		}, this));
	},

	_destroy: function() {
		this.element.editableText('destroy');
		chrome.runtime.onMessage.removeListener(this.$_onRuntimeMessage);
	},
	_setOption: function(key, value) {
		this._super(key, value);
		if(key === 'name') {
			this._setName(value);
		}
		this._refreshDisplay();
	},
	_setName: function(name) {
		this.element.editableText('option', 'value', name);
	},

	_getDisplay: function() {
		var name = this.option('name'),
			vars = this.option('varNames');

		var element = $('<span />');

		if(name) {
			var htmlValue = name;

			$.each(vars, function(name, humanVarName) {
				htmlValue = addHighlights(htmlValue, name, humanVarName, getVariableIndex(vars, name));
			});

			element.html(htmlValue);
		} else {
			element.text('(no name)');
		}
		return element;
	},

	_getEditingName: function() {
		return this.option('editingName');
	},

	startEditing: function() {
		this.element.editableText('startEditing');
	}
});

function preg_quote(str) {
	// http://kevin.vanzonneveld.net
	// +   original by: booeyOH
	// +   improved by: Ates Goral (http://magnetiq.com)
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// *     example 1: preg_quote("$40");
	// *     returns 1: '\$40'
	// *     example 2: preg_quote("*RRRING* Hello?");
	// *     returns 2: '\*RRRING\* Hello\?'
	// *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
	// *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

	return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

function addHighlights(data, search, humanVarName, highlightClass) {
	var replacementElement = $('<span />').attr({
			'data-name': humanVarName
		})
		.addClass('highlight highlight'+highlightClass)
		.text(humanVarName);

	var replacementHTML = ' ' + replacementElement[0].outerHTML + ' ';

    return data.replace(new RegExp('(^|\\s)' + preg_quote(search) + '($|\\s)', 'gi'), replacementHTML);
}
