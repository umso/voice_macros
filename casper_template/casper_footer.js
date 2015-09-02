        spooky.run();
    }
});

spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});

spooky.on('log', function (log) {
    //if (log.space === 'spooky.server' || log.space === 'remote' || log.space === 'phantom') {
        //console.log(log.message.replace(/ \- .*/, ''));
    //}
    console.log(log.message.replace(/ \- .*/, ''));
});

spooky.on('say', function (toSay) {
    spooky.execute([{}, function () {
            this.stillSaying = true;
        }
    ]);

    spooky.waitFor(function() {
        return !this.stillSaying;
    });

    speak(toSay).then(function() {
        spooky.execute([{}, function () {
                delete this.stillSaying;
            }
        ]);
    });
});

function doPrompt(promptFunction, promptRequest, timeout) {
    spooky.execute([{}, function () {
            this.stillPrompting = true;
        }
    ]);

    spooky.waitFor(function() {
        return !this.stillPrompting;
    }, function() {}, function(){}, timeout);

    promptFunction(promptRequest).then(function(result) {
        spooky.execute([{
            result: result
        }, function () {
                delete this.stillPrompting;
                this.promptResult = result;
            }
        ]);
    });
}

spooky.on('textPrompt', function(promptRequest) {
    return doPrompt(textPrompt, promptRequest, TEXT_TIMEOUT);
});

spooky.on('voicePrompt', function(promptRequest) {
    return doPrompt(voicePrompt, promptRequest, SPEECH_TIMEOUT);
})

function speak(toSay) {
    return new Promise(function(resolve) {
        say.speak(null, toSay, function() {
            resolve();
        });
    });
}

function textPrompt(requestText) {
    return new Promise(function(resolve, reject) {
        prompt.start();
        prompt.get([requestText], function(err, result) {
            if(err) {
                reject(err);
            } else {
                resolve(result[requestText]);
            }
        });
    });
}

function recordVoice() {
	return new Promise(function(resolve, reject) {
		var speakable = new Speakable({
			key: 'AIzaSyCkpg9WHi0IYpO2GOILq8emDR3qEz_43KM'
		});

		speakable.on('speechResult', function(result) {
			if(result.length > 0) {
				resolve(result[0].alternative[0].transcript);
			} else {
				resolve(false);
			}
		});

		speakable.on('error', function(err) {
			reject(err);
		});

		speakable.recordVoice();
	});
}

function voicePrompt(request) {
    return speak(request).then(function() {
        return recordVoice();
    }).then(function(response) {
        return response;
    });
}
