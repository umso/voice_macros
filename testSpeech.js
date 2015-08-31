var say = require('say');

speak('hello world').then(function() {
	return speak('goodbye world');
})


function speak(text) {
	return new Promise(function(resolve, reject) {
		say.speak(null, text, function() {
			resolve();
		});
	});
}
