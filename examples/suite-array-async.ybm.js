/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */


var ybm = require('../');

ybm.suite(
  [
    {maxTime: 0.6, fn: function(done) { done(); }},
    {maxTime: 0.6, fn: function(done) { setTimeout(done, 100); }},
    {maxTime: 0.6, defer: true, fn: function(promise) { setTimeout(function() {promise.resolve();}, 200); }}
  ],
  {
    async: false,
    historyOptions: {file: 'suite-array'}
  }
);
