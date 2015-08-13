$.widget('voice_commander.gotoDisplay', {
	options: {
		action: false
	},
	_create: function() {
		var action = this.option('action');
		this.element.text('Go to ' + action.url);
	},
	_destroy: function() {

	}
});
