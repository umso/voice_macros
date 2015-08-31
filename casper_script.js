//========================================================
// Casper generated Mon Aug 31 2015 14:58:02 GMT-0400 (EDT)
//========================================================

var say = require('say');
var Spooky = require('spooky');

var spooky = new Spooky({
    child: {
        transport: 'http'
    },
    casper: {
        logLevel: 'debug',
        verbose: true
    }
}, function(err, methods) {
    if(err) {
        var e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
    } else {
        spooky.start('https://www.pnc.com/en/personal-banking.html');

        spooky.then(function() {
            this.emit('say', 'hello world');
        });
        spooky.then(function() {
            this.emit('say', 'goodbye world');
        });

        spooky.run();
    }
});

function speak(text) {
    return new Promise(function(resolve, reject) {
        say.speak(null, text, function() {
            resolve();
        });
    });
}

spooky.on('say', function (toSay) {
    speak(toSay).then(function() {
        console.log(spooky);
    });
    spooky.wait(1000);
});


/*
try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}


var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e;
        }


        spooky.start('http://en.wikipedia.org/wiki/Spooky_the_Tuff_Little_Ghost');
        spooky.then(function () {
            console.log('a');
            this.emit('hello', 'Hello, from ' + this.evaluate(function () {
                return document.title;
            }));
        });
        spooky.run();
    });

spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});

/*
// Uncomment this block to see all of the things Casper has to say.
// There are a lot.
// He has opinions.
spooky.on('console', function (line) {
    console.log(line);
});
*/
/*

spooky.on('hello', function (greeting) {
    console.log(greeting);
});


/*

var casper = require('casper').create(),
    x = require('casper').selectXPath;

casper.options.viewportSize = {width: 1582, height: 1123};

casper.on('page.error', function(msg, trace) {
    this.echo('Error: ' + msg, 'ERROR');
    for(var i=0; i < trace.length; i++) {
        var step = trace[i];
        this.echo('   ' + step.file + ' (line ' + step.line + ')', 'ERROR');
    }
});

casper.start('https://www.pnc.com/en/personal-banking.html');

console.log(say);

/*
*/

//casper.run();
