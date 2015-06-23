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
    {maxTime: 0.6, fn: function() { return 'a'; }},
    {maxTime: 0.6, fn: function() { return 'b'; }},
    {maxTime: 0.6, fn: function() { return 'c'; }}
  ],
  {
    async: false,
    historyOptions: {file: 'suite-array'}
  }
);
