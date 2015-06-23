# ybm
<!--
[![NPM version](https://badge.fury.io/js/ybm.svg)](https://npmjs.org/package/ybm)
[![GitHub version][git-tag-image]][project-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-url]][daviddm-image]
[![Code Climate][climate-image]][climate-url]
[![Coverage Status][coveralls-image]][coveralls-url]
-->

Your benchmark.


## CLI

### Install

```bash
npm install --global ybm
```

### Usage

```bash
ybm some-benchmark-file
```

when `some-benchmark-file` updated, will trigger re-benchmark this file.


__Using `ybm -h` to see more help.__


## NODE


### Install
```bash
npm install --save ybm
```


### Usage

* Single test:

  ```js
  ybm(function() {
    // do task
  });
  ```

* Async test:

  ```js
  ybm(function(done) {
    setTimeout(done, 100);
  });
  ```

* Suite tests:

  ```js
  ybm.suite({
    'test_1': function() { /* do task */ },
    'test_2': function() { /* do task */ },
    'test_3': function() { /* do task */ }
  });  
  ```

* Matrix test:

  ```js
  var matrix = [
    row1,
    row2,
    //...
  ];
  
  ybm.matrix(matrix, function(row) {
    // create suite according row
    return suite;
  })
  ```
  

* More Examples:

  - [Single benchmark test](./examples/single.ybm.js)
  - [Single async benchmark test](./examples/single-async.ybm.js)
  - [Array suite benchmark tests](./examples/suite-array.ybm.js)
  - [Array suite async benchmark tests](./examples/suite-array-async.ybm.js)
  - [Object suite benchmark tests](./examples/suite-object.ybm.js)
  - [Matrix suite benchmark tests](./examples/matrix-suite.ybm.js)



## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [gulp](http://gulpjs.com/).


## Thanks

* [benchmark](https://github.com/bestiejs/benchmark.js) - A benchmarking library that works on nearly all JavaScript platforms, supports high-resolution timers, and returns statistically significant results.


## History

[CHANGELOG](CHANGELOG.md)


## License

Copyright (c) 2015 Zhonglei Qiu. Licensed under the MIT license.



[project-url]: https://github.com/qiu8310/ybm
[git-tag-image]: http://img.shields.io/github/tag/qiu8310/ybm.svg
[climate-url]: https://codeclimate.com/github/qiu8310/ybm
[climate-image]: https://codeclimate.com/github/qiu8310/ybm/badges/gpa.svg
[travis-url]: https://travis-ci.org/qiu8310/ybm
[travis-image]: https://travis-ci.org/qiu8310/ybm.svg?branch=master
[daviddm-url]: https://david-dm.org/qiu8310/ybm.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/qiu8310/ybm
[coveralls-url]: https://coveralls.io/r/qiu8310/ybm
[coveralls-image]: https://coveralls.io/repos/qiu8310/ybm/badge.png

