/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _benchmark = require('benchmark');

var _benchmark2 = _interopRequireDefault(_benchmark);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _ylog = require('ylog');

var _ylog2 = _interopRequireDefault(_ylog);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _ybmHistoryJs = require('./ybm-history.js');

var _ybmHistoryJs2 = _interopRequireDefault(_ybmHistoryJs);

//import YbmWatch from './ybm-watch.js';

/**
 * 判断 bmTest.fn 的参数是否含有 done，如果有，将其转化成 defer
 *
 * @param {Object} bmTest - benchmark 的对象参数
 * @param {Function} [fn] - 如果没设置，则直接取 bmTest.fn 的值
 * @returns {Boolean} - 如果需要转化，则转化并返回 true，否则返回 false
 * @private
 */
function _deferBenchmarkFunction(bmTest, fn) {
  fn = fn || bmTest.fn;

  if (/^\s*function\s*(?:\w+)?\s*\(\s*done\s*\)/.test(fn.toString())) {
    bmTest.defer = true;
    bmTest.fn = function (promise) {
      var done = function done() {
        promise.resolve.apply(promise, arguments);
      };
      fn(done);
    };
    return true;
  }
  return false;
}

/**
 * benchmark 历史记录相关的配置.
 * @typedef {Object} ybmHistoryOptions
 *
 * @property {String} baseDir - 设置相对路径，默认是 process.cwd()
 * @property {String} dir - history 文件存放的目录，相对于 `baseDir`，默认是 `'ybm-history'`
 * @property {String} file - history 文件名称，默认是 bmTest 的 name 属性
 * @property {Number} length - 保存历史记录的最多条数，默认 10
 * @property {Boolean} dump - 是否输出历史记录，默认 true
 * @property {Boolean} record，
 *  如果没有指定 file 或 bmTest 没有指定 name 参数，则默认为 false，否则默认为 true
 *  如果设置了 true，但没有指定 file 或 bmTest 中没有指定 name 参数，也会强制转化成 false
 *
 */

/**
 * benchmark watch 相关的配置.
 * @typedef {Object} ybmWatchOptions
 */

/**
 * benchmark 的对象 或 benchmark 函数.
 * @typedef {Object|Function} YbmTest
 */

function _inject(ctx, fnKey, newFn) {
  var old = ctx[fnKey];
  ctx[fnKey] = function () {
    var args = _lodash2['default'].slice(arguments);
    var rtn = newFn.apply(this, args);
    args.push(rtn);
    if (old) old.apply(this, args);
  };
}

function _formatNumber(number) {
  number = String(number).split('.');
  return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') + (number[1] ? '.' + number[1] : '');
}

function _extendCompletedBench(bench) {
  var labels = bench.labels = {},
      size = bench.stats.sample.length;

  labels.error = bench.error && bench.error.toString() || null;
  labels.name = bench.name || (isNaN(bench.id) ? bench.id : '<Test #' + bench.id + '>');
  labels.ops = _formatNumber(bench.hz.toFixed(bench.hz < 100 ? 2 : 0)) + ' ops/sec';
  labels.rate = '±' + bench.stats.rme.toFixed(2) + '%';
  labels.sample = size + ' run' + (size === 1 ? '' : 's') + ' sampled';
}

function _toBenchObj(bmTest) {
  if (_lodash2['default'].isFunction(bmTest)) bmTest = { fn: bmTest };

  (0, _assert2['default'])(_lodash2['default'].isObject(bmTest), 'bmTest should be a object or a function.');
  (0, _assert2['default'])(_lodash2['default'].isFunction(bmTest.fn), 'bmTest.fn should be a function.');

  _deferBenchmarkFunction(bmTest);

  return bmTest;
}

/**
 *
 * Your benchmark
 *
 * @param {YbmTest} bmTest - benchmark 的对象 或 benchmark 函数
 * @param {Object} runOptions
 *  除了 {@link http://benchmarkjs.com/docs#options benchmark options} 指定的参数，
 *  还包括下面这些 `ybm` 特有的参数
 *
 * @param {ybmHistoryOptions} runOptions.historyOptions
 * @param {ybmWatchOptions} runOptions.watchOptions
 *
 */
function ybm(bmTest, runOptions) {
  var bench = undefined,
      history = undefined;

  bmTest = _toBenchObj(bmTest);

  // 配置
  runOptions = _lodash2['default'].assign({ historyOptions: {}, watchOptions: null }, runOptions);
  var historyOptions = runOptions.historyOptions;

  history = new _ybmHistoryJs2['default'](historyOptions, bmTest);

  _inject(bmTest, 'onComplete', function (e) {
    _extendCompletedBench(bench);
    history.benchComplete(bench, e);
  });

  bench = new _benchmark2['default'](bmTest);

  bench.run(_lodash2['default'].omit(runOptions, ['historyOptions', 'watchOptions']));
}

/**
 *
 * @param {Array.<YbmTest>|Object} bmTests
 * @param {Object} runOptions - 类似于 ybm 函数的 runOptions 选项，
 *  只比它多了一些事件监听的函数，如：onCycle, onComplete, onError 等
 *
 */
ybm.suite = function (bmTests, runOptions) {
  var suite = undefined,
      history = undefined;

  var isArray = _lodash2['default'].isArray(bmTests);

  var isObject = _lodash2['default'].isPlainObject(bmTests);

  (0, _assert2['default'])(isArray || isObject, 'bmTests should be an Array or an Object');

  suite = new _benchmark2['default'].Suite();

  _lodash2['default'].each(bmTests, function (bmTest, key, ref) {
    bmTest = _toBenchObj(bmTest);
    ref[key] = bmTest;

    if (isObject && !bmTest.name) bmTest.name = key;else if (isArray && !bmTest.id) bmTest.id = key + 1;

    suite.add(bmTest);
  });

  // 配置
  runOptions = _lodash2['default'].assign({ historyOptions: {}, watchOptions: null }, runOptions);
  var historyOptions = runOptions.historyOptions;

  history = new _ybmHistoryJs2['default'](historyOptions, bmTests, true);

  _inject(runOptions, 'onComplete', function (e) {
    _lodash2['default'].each(suite, function (item) {
      return _extendCompletedBench(item);
    });
    history.suiteBenchComplete(suite, e);
  });

  _lodash2['default'].each(runOptions, function (val, key) {
    if (key.indexOf('on') === 0 && _lodash2['default'].isFunction(val)) {
      suite.on(_lodash2['default'].camelCase(key.substr(2)), val);
      delete runOptions[key];
    }
  });

  suite.run(_lodash2['default'].omit(runOptions, ['historyOptions', 'watchOptions']));
};

/**
 *
 * @param {Array} rows
 * @param {Function} createSuite
 */
ybm.matrix = function (rows, createSuite) {
  rows = rows.map(function (row) {
    return function () {
      return new _bluebird2['default'](function (resolve) {

        _ylog2['default'].ln.ln.writeFlag(row, '# MATRIX').ln();

        var suite = undefined,
            suiteOptions = undefined,
            cycle = undefined,
            cycleTasks = undefined;

        suite = createSuite(row);
        suiteOptions = suite.options || row.suiteOptions || {};
        cycle = suite.cycle || row.cycle || 1;
        suite = suite.suite || suite;

        cycle = _lodash2['default'].isNumber(cycle) && cycle > 0 ? cycle : 1;

        cycleTasks = _lodash2['default'].fill(new Array(cycle), function () {
          return new _bluebird2['default'](function (resolve, reject) {
            _inject(suiteOptions, 'onComplete', resolve);
            ybm.suite(suite, suiteOptions);
          });
        });

        _bluebird2['default'].reduce(cycleTasks, function (total, task) {
          if (cycle > 1) _ylog2['default'].log('\t============= CYCLE ' + total + ' =============');
          return task().then(function () {
            return total + 1;
          });
        }, 1).then(resolve);
      });
    };
  });

  _bluebird2['default'].reduce(rows, function (t, row) {
    return row();
  }, 0);
};

ybm.config = _ybmHistoryJs2['default'].config;

exports['default'] = ybm;
module.exports = exports['default'];