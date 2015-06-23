#!/usr/bin/env node

/*
  Useful resource:

  http://bocoup.com/weblog/building-command-line-tools-in-node-with-liftoff/

  optimist, minimist, yargs, nomnom, nopt, commander


  http://blog.npmjs.org/post/118810260230/building-a-simple-command-line-tool-with-npm
  http://blog.npmjs.org/post/119317128765/adding-subcommands-to-your-command-line-tool
  http://blog.npmjs.org/post/119377806820/making-your-command-line-tool-configurable

*/


var ybm = require('../');
var program = require('commander');
var _ = require('lodash');
var gaze = require('gaze');
var ylog = require('ylog');
var spawn = require('cross-spawn');
var pkg = require('../package.json');

var watches = [];
function collect(val, container) { container.push(val); return container; }

program
  .version(pkg.version)
  .usage('[options] <benchFile> [arguments]')
  .description('Continuous integration benchmark test.')
  .option('-w, --watch [pattern]', 'file patterns which updated will trigger re-benchmark', collect, watches)
  .parse(process.argv);

if (program.args.length < 1) { program.help(); process.exit(0); }


var benchFile = program.args[0];
var running = false, waiting = false, count = 0;

function run() {
  if (running) { waiting = true; return false; }
  running = true;
  count++;

  ylog.title('YBM #' + count).log('...');
  var ps = spawn('node', program.args, { stdio: 'inherit' });
  ps.on('close', function() {
    ylog.ln(2);
    running = false;
    if (waiting) {
      run();
      waiting = false;
    }
  });
}

gaze(watches.concat(benchFile), function() {
  var update = _.throttle(function() {
    run();
  }, 500);
  this.on('changed', update);
  this.on('added', update);
});

run();

