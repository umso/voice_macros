$.widget("voice_commander.editableText", {
	options: {
		value: "",
		getDisplay: false,
		updateOwnValue: true
	},
	_create: function () {
		this._editing = false;
		this._showDisplay();
	},
	_destroy: function () {
	},

	refreshDisplay: function() {
		this._showDisplay();
	},

	_setOption: function(key, value) {
		this._super(key, value);

		if(key === "value") {
			if(this._editing) {
				this._showEditor();
			} else {
				this._showDisplay();
			}
		}
	},
	_onEditBlur: function(event) {
		this._confirmEdit();
		event.preventDefault();
		event.stopPropagation();
	},

	_onEditKeydown: function(event) {
		var keyCode = event.keyCode;

		if(keyCode === 27) { //esc
			event.preventDefault();
			event.stopPropagation();
			this._cancelEdit();
		} else if(keyCode === 13) { //enter
			if(!event.shiftKey && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				event.stopPropagation();

				this._confirmEdit();
			}
		}
	},

	_confirmEdit: function() {
		var value = this.textEditor.val();

		var e = new $.Event('textChange');
		e.value = value;
		this.element.trigger(e);
		this._stopEditing();

		if(this.option('updateOwnValue')) {
			this.option('value', value);
		}
	},

	_cancelEdit: function() {
		var e = new $.Event('changeCancel');
		this.element.trigger(e);
		this._stopEditing();
	},

	_stopEditing: function() {
		if(this._editing) {
			this._editing = false;
			this._showDisplay();
		}
	},

	_startEditing: function() {
		if(!this._editing) {
			this._editing = true;
			this._showEditor();
		}
	},

	startEditing: function() {
		return this._startEditing();
	},

	_showDisplay: function() {
		var getDisplay = this.option('getDisplay'),
			value = this.option('value');

		this.element.children().remove();

		if(getDisplay) {
			var display = getDisplay(value);
			if(display instanceof Promise) {
				display.then($.proxy(function(element) {
					this.element.children().remove();
					this.element.append(element);
				}, this));
			} else {
				this.element.append(display)
			}
		} else {
			var content = $('<span />').text(value);
			this.element.append(content);
		}

		this.element.on('click.startEditing', $.proxy(this._startEditing, this));
	},

	_showEditor: function() {
		this.element.off('click.startEditing');
		this.element.children().remove();

		this.textEditor = $('<input />').appendTo(this.element)
										.val(this.option('value'))
										.on('keydown', $.proxy(this._onEditKeydown, this))
										.on('blur', $.proxy(this._onEditBlur, this))
										.css({
											'font-family': 'inherit',
											'font-weight': 'inherit',
											'font-style': 'inherit',
											'font-size': 'inherit',
											'outline': 'none',
											'border': 'none',
											'padding': '0px',
											'margin': '0px',
											'background': 'none',
											'color': 'inherit'
										})
										.select()
										.focus();
	}
});


var UniqueChildTracker = (function(My) {
	var proto = My.prototype;

	proto.setChildren = function(children) {
		var unusedKeys = {},
			childViews,
			promises = [];

		_.each(this.children, function(val, key) {
			unusedKeys[key] = val;
		})

		childViews = _.map(children, function(child, key) {
			var key = this.getKey(child, key),
				childView = this.getChildView(key, child);

			delete unusedKeys[key];

			if(childView instanceof Promise) {
				promises.push(childView);
			}

			return childView;
		}, this);

		_.each(_.keys(unusedKeys), function(key) {
			delete this.children[key];
		}, this);

		return Promise.all(promises).then(function() {
			return {
				childViews: childViews,
				toRemove: unusedKeys
			};
		});
	};

	proto.getChildView = function(key, child) {
		if(this.children.hasOwnProperty(key)) {
			return this.children[key];
		} else {
			var childView = this.createElement(child, key);
			this.children[key] = childView;
			return childView;
		}
	};

	proto.destroy = function() {
		delete this.getKey;
		delete this.createElement;
		delete this.children;
	};

	return My;
}(function(createElement, getKey) {
	this.createElement = createElement;
	this.getKey = getKey || function(child, key) {
		return key;
	};
	this.children = {};
}));
