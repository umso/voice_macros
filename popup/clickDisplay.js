$.widget('voice_commander.clickDisplay', {
	options: {
		action: false
	},
	_create: function() {
		var action = this.option('action');

		this.element.text('Click ');
		this.img = $('<img />').appendTo(this.element)
								.hide();
		this._refresh();
	},
	_destroy: function() {
	},
	_setOption: function(key, value) {
		this._super(key, value);
		this._refresh();
	},
	_refresh: function() {
		var action = this.option('action');

		var imageURI = action.imageURI;
		if(imageURI) {
			this.img.attr('src', imageURI)
					.show();
		} else {
			this.img.hide();
		}
	}
});
