$.widget('voice_commander.variables', {
	options: {
		name: "My Command"
	},
	_create: function() {
	},
	_destroy: function() {
	},

	_refresh: function() {
		getVariables().then($.proxy(this._doRefresh, this));
	},
	_doRefresh: function(variables) {

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
	},
	_destroy: function() {

	},
	_setOption: function() {

	}
})
