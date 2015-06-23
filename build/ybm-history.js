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

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _humanTime = require('human-time');

var _humanTime2 = _interopRequireDefault(_humanTime);

var _ylog = require('ylog');

var _ylog2 = _interopRequireDefault(_ylog);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

function md5(buf) {
  return _crypto2['default'].createHash('md5').update(buf, 'utf8').digest('hex');
}

function filter(list, type) {
  var target = { hz: type === 'fastest' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY };
  _lodash2['default'].each(list, function (item) {
    if (item && item.hz) {
      if (type === 'fastest' ? item.hz > target.hz : item.hz < target.hz) target = item;
    }
  });
  return target;
}

var Config = { baseDir: process.cwd(), dir: 'ybm-history' };

var YbmHistory = (function () {
  function YbmHistory(options, bmTest, isSuite) {
    _classCallCheck(this, YbmHistory);

    if (!options.file && bmTest.name) options.file = bmTest.name;

    this.isSuite = !!isSuite;
    this.enabled = !!(options.record !== false && options.file);
    this.length = parseInt(options.length, 10) || 10;
    this._dump = options.dump !== false;
    this._dumpEnv = options.dumpEnv !== false;

    if (this.enabled) {
      var _$assign = _lodash2['default'].assign({}, Config, options);

      var baseDir = _$assign.baseDir;
      var dir = _$assign.dir;
      var file = _$assign.file;

      var hash = md5(JSON.stringify(bmTest) + this.isSuite);

      file = file.replace(/(?:\.json)?$/, '.json');
      dir = _path2['default'].join(baseDir, dir);
      file = _path2['default'].join(dir, file);

      this.path = file;

      _fsExtra2['default'].ensureDirSync(dir);
      if (!_fsExtra2['default'].existsSync(file) || this.read().hash !== hash) {
        this.write({ fastest: null, list: [], hash: hash });
      }
    } else {
      this.path = null;
    }
  }

  _createClass(YbmHistory, [{
    key: 'read',
    value: function read() {
      return _fsExtra2['default'].readJsonSync(this.path);
    }
  }, {
    key: 'write',
    value: function write(obj) {
      return _fsExtra2['default'].writeJsonSync(this.path, obj);
    }
  }, {
    key: 'getBenchData',
    value: function getBenchData(bench) {
      return _lodash2['default'].assign(_lodash2['default'].clone(bench.labels), { time: Date.now(), hz: bench.hz });
    }
  }, {
    key: '_dumpItem',
    value: function _dumpItem(item, options) {
      var _ref = options || {};

      var fastest = _ref.fastest;
      var slowest = _ref.slowest;
      var md = _ref.md;
      var mean = _ref.mean;

      md = md != null ? md : item === fastest ? '&' : item === slowest ? '#' : '';
      var time = (0, _humanTime2['default'])(new Date(item.time)),
          tpl = undefined;
      if (item.error) {
        tpl = '__' + item.name + '__ #' + item.error + '#';
      } else {
        var diff = (item.hz - mean) * 100 / mean;
        var dl = Math.abs(diff).toFixed(2) + '% ' + (diff > 0 ? 'faster' : diff < 0 ? 'slower' : '');
        dl = fastest ? ' (' + dl + ')' : '';

        tpl = '__' + item.name + '__ ' + md + item.ops + ' ' + item.rate + dl + md + ' *(' + item.sample + ' at ' + time + ')*';
      }
      _ylog2['default'].log(tpl);
    }
  }, {
    key: '_dumpItemList',
    value: function _dumpItemList(list) {
      var _this = this;

      var fastest = list.length > 1 ? filter(list, 'fastest') : null;
      var slowest = list.length > 2 ? filter(list, 'slowest') : null;
      var mean = _lodash2['default'].sum(list, 'hz') / list.length;

      _lodash2['default'].each(list, function (item) {
        return _this._dumpItem(item, { fastest: fastest, slowest: slowest, mean: mean });
      });
    }
  }, {
    key: 'dumpEnv',
    value: function dumpEnv() {
      if (!this._dumpEnv) return false;

      var env = _lodash2['default'].pick(process.versions, ['node', 'v8', 'zlib']);
      env.system = _os2['default'].type() + ' ' + _os2['default'].arch();
      env.cpu = _lodash2['default'].first(_os2['default'].cpus()).model + ' x' + _os2['default'].cpus().length;
      _ylog2['default'].ln.writeFlag(env, 'System environment');
    }
  }, {
    key: 'dump',
    value: function dump(data) {
      var _this2 = this;

      this.dumpEnv();

      _ylog2['default'].ln.title('latest benchmark : ');

      if (this.isSuite) {

        _lodash2['default'].each(data.list, function (suite) {
          _this2._dumpItemList(suite);
          _ylog2['default'].ln();
        });
      } else {
        var fastest = filter(data.list, 'fastest');
        this._dumpItemList(data.list);

        if (data.fastest.hz > fastest.hz) {
          _ylog2['default'].ln.title('history fastest : ');
          this._dumpItem(data.fastest, { md: '~' });
        }
      }
    }
  }, {
    key: '_complete',
    value: function _complete(listItem) {

      if (!this.enabled) {
        this[this.isSuite ? '_dumpItemList' : '_dumpItem'](listItem);
        return listItem;
      }

      var data = this.read();
      data.list.push(listItem);
      if (data.list.length > this.length) data.list.shift();

      if (!this.isSuite) {
        // 保存最快的
        data.fastest = filter(data.list.concat(data.fastest || []), 'fastest');
      }

      this.write(data);

      if (this._dump) this.dump(data);
      return data;
    }
  }, {
    key: 'benchComplete',

    /**
     * 单个 bench 触发了 onComplete 事件
     * @param {Object} bench
     * @param {Event} event
     * @returns {{list: Array, fastest: Object}}
     */
    value: function benchComplete(bench, event) {
      return this._complete(this.getBenchData(bench));
    }
  }, {
    key: 'suiteBenchComplete',

    /**
     * benchmark suite 触发了 onComplete 事件
     * @param {Array} benchs
     * @param {Event} event
     * @returns {*}
     */
    value: function suiteBenchComplete(benchs, event) {
      var _this3 = this;

      return this._complete(_lodash2['default'].map(benchs, function (bench) {
        return _this3.getBenchData(bench);
      }));
    }
  }], [{
    key: 'config',
    value: function config(key, val) {
      if (key in Config) {
        Config[key] = val;
      }
    }
  }]);

  return YbmHistory;
})();

exports['default'] = YbmHistory;
module.exports = exports['default'];