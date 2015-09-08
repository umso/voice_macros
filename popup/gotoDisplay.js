$.widget('voice_commander.gotoDisplay', {
	options: {
		action: false
	},
	_create: function() {
		var action = this.option('action'),
			url = action.url;

		this.goToDisplay = $('<span />').addClass('command_type go_to').text('go to ').appendTo(this.element);

		this.uri = $('<span />').editableText({
						updateOwnValue: false,
						getDisplay: $.proxy(this._getDisplay, this),
						value: url
					})
					.on('textChange', $.proxy(function(event) {
						action.url = event.value;
						postUpdate(action);
					}, this))
					.appendTo(this.element);

		this._updateURI();
	},
	_destroy: function() {
	},
	_updateURI: function() {
	},
	_getDisplay: function(url) {
		var uriDisplay = $('<span />').addClass('uri');
		var protocolName = $('<span />').addClass('protocol').appendTo(uriDisplay);
		var protocolDelimiter = $('<span />').addClass('delimiter').appendTo(uriDisplay);
		var hostName = $('<span />').addClass('hostName').appendTo(uriDisplay);
		var path = $('<span />').addClass('path').appendTo(uriDisplay);

		var parsedURI = parseURI(url),
			protocolText,
			delimiter,
			pathValue;

		if(parsedURI.protocol === 'http') {
			protocolText = '';
			delimiter = '';
		} else {
			protocolText = parsedURI.protocol;
			delimiter = '://';
		}

		if(parsedURI.path === '/') {
			pathValue = '';
		} else {
			pathValue = parsedURI.path;
		}

		protocolName.text(protocolText);
		protocolDelimiter.text(delimiter);
		hostName.text(parsedURI.host);
		path.text(pathValue);

		return uriDisplay;
	},
	_setOption: function(key, value) {
		this._super(key, value);
		if(key === 'stepNumber') {
			this.stepNumberDisplay.text(value);
		}
	}
});

// Source: Kyle Florence (based on code by Steven Levithan)
// https://gist.github.com/kflorence/1169555
function parseURI(uri) {
	var uriRegex = new RegExp(
			// Protocol
			"^(?:(?![^:@]+:[^:@/]*@)([^:/?#.]+):)?(?://)?" +
			// Authority
			"(" +
			// Credentials
			"(?:(" +
			// Username
			"([^:@]*)" +
			// Password
			"(?::([^:@]*))?" +
			")?@)?" +
			// Host
			"([^:/?#]*)" +
			// Port
			"(?::(\\d*))?" +
			// Relative
			")(" +
			// Path
			"(" +
			// Directory
			"(/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[?#]|$)))*/?)?" +
			// File
			"([^?#/]*)" +
			")" +
			// Query
			"(?:\\?([^#]*))?" +
			// Anchor
			"(?:#(.*))?" +
			")"
		),

		// Parses key/value pairs from a query string
		queryKeysRegex = /(?:^|&)([^&=]*)=?([^&]*)/g,

		// Keys for the uri hash, mapped from the matches array
		properties = [
			"source", "protocol", "authority", "credentials",
			"username", "password", "host", "port",
			"relative", "path", "directory", "file",
			"extension", "query", "anchor"
		],
		i = 0,
		l = properties.length,
		matches = uriRegex.exec( uri ),
		uri = {
			queryData: {}
		};

	for ( ; i < l; i++ ) {
		uri[ properties[ i ] ] = matches[ i ] || "";
	}

	uri.query.replace(queryKeysRegex, function(matched, key, value, offset, str) {
		if ( key && key.length ) {
			uri.queryData[ key ] = value;
		}
	});

	return uri;
};
