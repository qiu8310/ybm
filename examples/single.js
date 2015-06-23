/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */


var ybm = require('../');

// benchmark test 可以是一个 function
// 也可以是一个带 `fn` 属性的对象
// 参考：http://benchmarkjs.com/docs#Benchmark


ybm(function() {
  return 'a';
});

ybm({
  maxTime: 1,
  fn: function() { return 'a'; }
});
