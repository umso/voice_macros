$.widget('voice_commander.gotoDisplay', {
	options: {
		action: false
	},
	_create: function() {
		this.goToDisplay = $('<span />').addClass('command_type go_to').text('go to ').appendTo(this.element);
		this.uriDisplay = $('<span />').addClass('uri').appendTo(this.element);
		this.protocolName = $('<span />').addClass('protocol').appendTo(this.uriDisplay);
		this.protocolDelimiter = $('<span />').addClass('delimiter').appendTo(this.uriDisplay);
		this.hostName = $('<span />').addClass('hostName').appendTo(this.uriDisplay);
		this.path = $('<span />').addClass('path').appendTo(this.uriDisplay);

		this._updateURI();
	},
	_destroy: function() {
	},
	_updateURI: function() {
		var action = this.option('action'),
			parsedURI = parseURI(action.url),
			protocolText,
			protocolDelimiter,
			path;

		if(parsedURI.protocol === 'http') {
			protocolText = '';
			protocolDelimiter = '';
		} else {
			protocolText = parsedURI.protocol;
			protocolDelimiter = '://';
		}

		if(parsedURI.path === '/') {
			path = '';
		} else {
			path = parsedURI.path;
		}

		this.protocolName.text(protocolText);
		this.protocolDelimiter.text(protocolDelimiter);
		this.hostName.text(parsedURI.host);
		this.path.text(path);
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
