var SPEECH_TIMEOUT = 15000,
	TEXT_TIMEOUT = 10000,
	INTERACTION_TIMEOUT = 20000;

var say = require('say'),
	Spooky = require('spooky'),
	prompt = require('prompt'),
	Speakable = require('speakable');

function runScript(args) {
	var spooky = new Spooky({
	    child: {
	        transport: 'http',
			 'ssl-protocol': 'any'
	    },
	    casper: {
	        logLevel: 'debug',
	        verbose: true,
			viewportSize: {}
	    }
	}, function(err, methods) {
	    if(err) {
	        var e = new Error('Failed to initialize SpookyJS');
	        e.details = err;
	        throw e;
	    } else {
