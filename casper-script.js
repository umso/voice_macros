var x = require('casper').selectXPath;
casper.options.viewportSize = {width: 1366, height: 643};
casper.on('page.error', function(msg, trace) {
   this.echo('Error: ' + msg, 'ERROR');
   for(var i=0; i<trace.length; i++) {
       var step = trace[i];
       this.echo('   ' + step.file + ' (line ' + step.line + ')', 'ERROR');
   }
});
casper.test.begin('Resurrectio test', function(test) {
   casper.start('http://google.com');
   casper.waitForSelector("form[name=f] input[name='q']",
       function success() {
           test.assertExists("form[name=f] input[name='q']");
           this.click("form[name=f] input[name='q']");
       },
       function fail() {
           test.assertExists("form[name=f] input[name='q']");
   });
   casper.waitForSelector("input[name='q']",
       function success() {
           this.sendKeys("input[name='q']", "this is google");
       },
       function fail() {
           test.assertExists("input[name='q']");
   });
   casper.waitForSelector(x("//a[normalize-space(text())='This is Google - Google Careers']"),
       function success() {
           test.assertExists(x("//a[normalize-space(text())='This is Google - Google Careers']"));
           this.click(x("//a[normalize-space(text())='This is Google - Google Careers']"));
       },
       function fail() {
           test.assertExists(x("//a[normalize-space(text())='This is Google - Google Careers']"));
   });

   casper.then(function() {
       test.comment("this is a comment");
   });


   casper.run(function() {test.done();});
});