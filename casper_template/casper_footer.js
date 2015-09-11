			spooky.then(function() { this.emit('log', 'done'); })
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
        console.log(log.message ? log.message.replace(/ \- .*/, '') : log);
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

    spooky.on('textPrompt', function(promptRequest) {
        return doPrompt(textPrompt, promptRequest, TEXT_TIMEOUT);
    });

    spooky.on('voicePrompt', function(promptRequest) {
        return doPrompt(voicePrompt, promptRequest, SPEECH_TIMEOUT);
    });
	spooky.on('clear_interval', function(interval_id) {
		clearI(interval_id);
	});

	spooky.on('requestInteraction', function(info) {
		requestInteraction(info);
	});
	return spooky;
}
var speak, textPrompt, voicePrompt, requestInteraction;


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

function speakLocally(toSay) {
    return new Promise(function(resolve) {
        say.speak(null, toSay, function() {
            resolve();
        });
    });
}

function textPromptLocally(requestText) {
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

function recordVoiceLocally() {
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

function voicePromptLocally(request) {
    return speakLocally(request).then(function() {
        return recordVoiceLocally();
    }).then(function(response) {
        return response;
    });
}

function getRemoteSpeakFunction(socket) {
    return function(request) {
        return speakLocally.apply(this, arguments);
    };
}

function getRemoteTextPromptFunction(socket) {
    return function(request) {
        return textPromptLocally.apply(this, arguments);
    };
}

function getRemoteVoicePromptFunction(socket) {
    return function(request) {
        return voicePromptLocally.apply(this, arguments);
    };
}

function getRemoteInteractionFunction(socket, spooky) {
	spooky.on('done_interacting', function(info) {
		socket.emit('done_interacting', info);
	});

	return function(info) {
		var interactionQueue;

        spooky.execute([{
			info: info
		}, function () {
                this.interacting = info;
            }
        ]);

        spooky.waitFor(function() {
			var canContinue = this.waitingForFn();
			if(canContinue) {
				this.emit('done_interacting', this.interacting);
				delete this.waitingForFn;
				delete this.interacting;
			}
			return canContinue || !this.interacting;
        }, function(){}, function(){}, INTERACTION_TIMEOUT);

		socket.on('interactionEvent', function(eventSummary) {
			if(eventSummary.mouse) {
				spooky.execute([{
					eventSummary: eventSummary
				}, function() {
					this.page.sendEvent(eventSummary.type, eventSummary.x, eventSummary.y);
				}]);
			} else if(eventSummary.keyboard) {
				spooky.execute([{
					eventSummary: eventSummary
				}, function() {
					this.page.sendEvent(eventSummary.type, eventSummary.which);
				}]);
			}
		});

		var sshotInterval = false;

		sshotInterval = setI(function() {
            spooky.execute([{
				info: info,
				interval_id: sshotInterval
			}, function() {
				if(this.interacting) {
					this.page.render('sshots/' + info.ssid);
				} else {
					this.emit('clear_interval', interval_id);
				}
            }]);
			socket.emit('update_sshot', info);
		}, 1000);

		socket.emit('show_sshot', info);
	};
}

function requestInteractionLocally() { }

if(require.main === module) {
    textPromp = textPromptLocally;
    voicePrompt = voicePromptLocally;
    speak = speakLocally;
	requestInteraction = requestInteractionLocally;

    runScript();
} else {
    module.exports = function(socket) {
        textPrompt = getRemoteTextPromptFunction(socket);
        voicePrompt = getRemoteVoicePromptFunction(socket);
        speak = getRemoteSpeakFunction(socket);
        var spooky = runScript();
		requestInteraction = getRemoteInteractionFunction(socket, spooky);
    };
}

var intervalID = 0,
	intervals = {};
function setI() {
	var id = intervalID++;
	intervals[id] = setInterval.apply(this, arguments);
	return id;
}

function clearI(id) {
	var intervalObj = intervals[id];
	delete intervals[id];
}
