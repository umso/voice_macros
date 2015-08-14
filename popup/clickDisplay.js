$.widget('voice_commander.clickDisplay', {
	options: {
		action: false
	},
	_create: function() {
		var action = this.option('action');
		this.element.text('Click ');
	},
	_destroy: function() {
	}
});
