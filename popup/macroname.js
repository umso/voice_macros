$.widget('voice_commander.macroName', {
	options: {
		name: "My Command"
	},
	_create: function() {
		this.element.editableText({
						updateOwnValue: false,
						getDisplay: $.proxy(this._getDisplay, this)
					})
					.on('textChange', function(event) {
						postNewName(event.value);
					});

		chrome.runtime.onMessage.addListener($.proxy(function(request, sender, sendResponse) {
			var action = request.action;

			if(action === 'nameMacro') {
				var name = request.name;
				this.option('name', name);
			} else if(action === 'varChanged') {
				this._setName(this.option('name'));
			}
		}, this));

		getName().then($.proxy(function(name) {
			this.option('name', name);
		}, this));
	},
	_destroy: function() {
	},
	_setOption: function(key, value) {
		this._super(key, value);
		if(key === 'name') {
			this._setName(value);
		}
	},
	_setName: function(name) {
		this.element.editableText('option', 'value', name);
	},

	_getDisplay: function(name) {
		return getVariables().then($.proxy(this._doGetDisplay, this, name));
	},
	_doGetDisplay: function(name, vars) {
		console.log(name, vars);
		var element = $('<span />');

		if(name.trim()) {
			var htmlValue = name;

			$.each(vars, function(name, value) {
				htmlValue = addHighlights(htmlValue, name, 0);
			});

			element.html(htmlValue);
		} else {
			element.text('(no name)');
		}
		return element;
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

function addHighlights(data, search, highlightClass) {
	var replacementElement = $('<span />').attr({
			'data-name': search
		})
		.addClass('highlight highlight'+highlightClass)
		.text(search);

	var replacementHTML = ' ' + replacementElement[0].outerHTML + ' ';

    return data.replace(new RegExp('(^|\\s)' + preg_quote(search) + '($|\\s)', 'gi'), replacementHTML);
}
