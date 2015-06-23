/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

var ybm = require('../');

ybm(
  {
    name: 'single-async',
    maxTime: 1,

    // 如果是异步，参数必须是 done；
    // 另外你可以用 benchmark.js 默认的 defer 属性，参考这里的第二个 Example：http://benchmarkjs.com/docs#Benchmark
    fn: function(done) { setTimeout(done, 100); }
  },

  {
    historyOptions: {file: 'single-async'} // 如果指定了 `name`，这时的 `file` 就可以不写
  }
);
