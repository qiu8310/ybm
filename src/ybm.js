/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

import Benchmark from 'benchmark';
import _ from 'lodash';
import ylog from 'ylog';
import assert from 'assert';
import Bluebird from 'bluebird';


import YbmHistory from './ybm-history.js';
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
    bmTest.fn = function(promise) {
      var done = function() { promise.resolve.apply(promise, arguments); };
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
  let old = ctx[fnKey];
  ctx[fnKey] = function() {
    let args = _.slice(arguments);
    let rtn = newFn.apply(this, args);
    args.push(rtn);
    if (old) old.apply(this, args);
  };
}

function _formatNumber(number) {
  number = String(number).split('.');
  return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') + (number[1] ? '.' + number[1] : '');
}

function _extendCompletedBench(bench) {
  let labels = bench.labels = {}, size = bench.stats.sample.length;

  labels.error = bench.error && bench.error.toString() || null;
  labels.name = bench.name || (isNaN(bench.id) ? bench.id : '<Test #' + bench.id + '>');
  labels.ops = _formatNumber(bench.hz.toFixed(bench.hz < 100 ? 2 : 0)) + ' ops/sec';
  labels.rate = '\xb1' + bench.stats.rme.toFixed(2) + '%';
  labels.sample = size + ' run' + (size === 1 ? '' : 's') + ' sampled';
}

function _toBenchObj(bmTest) {
  if (_.isFunction(bmTest)) bmTest = {fn: bmTest};

  assert(_.isObject(bmTest), 'bmTest should be a object or a function.');
  assert(_.isFunction(bmTest.fn), 'bmTest.fn should be a function.');

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
  let bench, history;

  bmTest = _toBenchObj(bmTest);

  // 配置
  runOptions = _.assign({historyOptions: {}, watchOptions: null}, runOptions);
  let {historyOptions} = runOptions;

  history = new YbmHistory(historyOptions, bmTest);

  _inject(bmTest, 'onComplete', (e) => {
    _extendCompletedBench(bench);
    history.benchComplete(bench, e);
  });

  bench = new Benchmark(bmTest);

  bench.run(_.omit(runOptions, ['historyOptions', 'watchOptions']));
}

/**
 *
 * @param {Array.<YbmTest>|Object} bmTests
 * @param {Object} runOptions - 类似于 ybm 函数的 runOptions 选项，
 *  只比它多了一些事件监听的函数，如：onCycle, onComplete, onError 等
 *
 */
ybm.suite = function(bmTests, runOptions) {
  let suite, history;

  let [isArray, isObject] = [_.isArray(bmTests), _.isPlainObject(bmTests)];
  assert(isArray || isObject, 'bmTests should be an Array or an Object');

  suite = new Benchmark.Suite();

  _.each(bmTests, (bmTest, key, ref) => {
    bmTest = _toBenchObj(bmTest);
    ref[key] = bmTest;

    if (isObject && !bmTest.name) bmTest.name = key;
    else if (isArray && !bmTest.id) bmTest.id = key + 1;

    suite.add(bmTest);
  });

  // 配置
  runOptions = _.assign({historyOptions: {}, watchOptions: null}, runOptions);
  let {historyOptions} = runOptions;

  history = new YbmHistory(historyOptions, bmTests, true);

  _inject(runOptions, 'onComplete', (e) => {
    _.each(suite, (item) => _extendCompletedBench(item));
    history.suiteBenchComplete(suite, e);
  });

  _.each(runOptions, (val, key) => {
    if (key.indexOf('on') === 0 && _.isFunction(val)) {
      suite.on(_.camelCase(key.substr(2)), val);
      delete runOptions[key];
    }
  });

  suite.run(_.omit(runOptions, ['historyOptions', 'watchOptions']));
};

/**
 *
 * @param {Array} rows
 * @param {Function} createSuite
 */
ybm.matrix = function (rows, createSuite) {
  rows = rows.map(function(row) {
    return function() {
      return new Bluebird(function(resolve) {

        ylog.ln.ln.writeFlag(row, '# MATRIX').ln();

        let suite, suiteOptions, cycle, cycleTasks;

        suite = createSuite(row);
        suiteOptions = suite.options || row.suiteOptions || {};
        cycle = suite.cycle || row.cycle || 1;
        suite = suite.suite || suite;

        cycle = _.isNumber(cycle) && cycle > 0 ? cycle : 1;


        cycleTasks = _.fill(new Array(cycle), function() {
          return new Bluebird(function (resolve, reject) {
            _inject(suiteOptions, 'onComplete', resolve);
            ybm.suite(suite, suiteOptions);
          });
        });

        Bluebird
          .reduce(cycleTasks, function (total, task) {
            if (cycle > 1) ylog.log('\t============= CYCLE ' + total + ' =============');
            return task().then(function() { return total + 1; });
          }, 1)
          .then(resolve);
      });
    };
  });

  Bluebird.reduce(rows, function(t, row) { return row(); }, 0);
};


export default ybm;

