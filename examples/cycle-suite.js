/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

var ybm = require('../');

ybm.cycle(
  2, 

  {
    A: function() { return 'A'; },
    B: function() { return 'B'; }
  }, 

  function() {
    console.log('done');
  }
);

