/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

var ybm = require('../');
var _ = require('lodash');

var matrix = [
  {opts: {async: false, taskSize: 10},    benchOpts: { maxTime: 1 }},
  {opts: {async: true, taskSize: 10},     benchOpts: { maxTime: 1 }},
  {opts: {async: false, taskSize: 1000},  benchOpts: { maxTime: 1 }},
  {opts: {async: true, taskSize: 1000},   benchOpts: { maxTime: 1 }}
];


ybm.matrix(matrix, function(row) {
  var keys = ['A', 'B'],
    suite = {};

  keys.forEach(function(key) {
    var benchOpts = _.clone(row.benchOpts || {});
    benchOpts.fn = function () { return row.opts; };
    suite[key] = benchOpts;
  });

  return {suite: suite, cycle: 2, suiteOptions: {onError: function() { /* ... */ }}};

  // or you can just
  // return suite;

});
