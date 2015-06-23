/*
 * ybm
 * https://github.com/qiu8310/ybm
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import hm from 'human-time';
import ylog from 'ylog';
import crypto from 'crypto';
import os from 'os';

function md5 (buf) {
  return crypto.createHash('md5').update(buf, 'utf8').digest('hex');
}

function filter(list, type) {
  let target = {hz: type === 'fastest' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY};
  _.each(list, (item) => {
    if (item && item.hz) {
      if (type === 'fastest' ? item.hz > target.hz : item.hz < target.hz) target = item;
    }
  });
  return target;
}

let Config = { baseDir: process.cwd(), dir: 'ybm-history' };

export default class YbmHistory {

  static config (key, val) {
    if (key in Config) {
      Config[key] = val;
    }
  }

  constructor (options, bmTest, isSuite) {

    if (!options.file && bmTest.name) options.file = bmTest.name;

    this.isSuite = !!isSuite;
    this.enabled = !!(options.record !== false && options.file);
    this.length = parseInt(options.length, 10) || 10;
    this._dump = options.dump !== false;
    this._dumpEnv = options.dumpEnv !== false;

    if (this.enabled) {
      let {baseDir, dir, file} = _.assign({}, Config, options);
      let hash = md5(JSON.stringify(bmTest) + this.isSuite);

      file = file.replace(/(?:\.json)?$/, '.json');
      dir = path.join(baseDir, dir);
      file = path.join(dir, file);

      this.path = file;

      fs.ensureDirSync(dir);
      if (!fs.existsSync(file) || this.read().hash !== hash) {
        this.write({fastest: null, list: [], hash: hash});
      }

    } else {
      this.path = null;
    }

  }

  read () {
    return fs.readJsonSync(this.path);
  }

  write (obj) {
    return fs.writeJsonSync(this.path, obj);
  }

  getBenchData (bench) {
    return _.assign(_.clone(bench.labels), {time: Date.now(), hz: bench.hz});
  }

  _dumpItem (item, options) {
    let {fastest, slowest, md, mean} = options || {};

    md = md != null ? md : item === fastest ? '&' : item === slowest ? '#' : '';
    let tpl;
    if (item.error) {
      tpl = `__${item.name}__ #${item.error}#`;
    } else {
      let diff = (item.hz - mean) * 100 / mean;
      let dl = Math.abs(diff).toFixed(2) + '% ' + (diff > 0 ? 'faster' : diff < 0 ? 'slower' : '');
      dl = fastest ? ' (' + dl + ')' : '';

      let time = this.enabled ? ' at ' + hm(new Date(item.time)) : '';

      tpl = `__${item.name}__ ${md}${item.ops} ${item.rate}${dl}${md} *(${item.sample}${time})*`;
    }
    ylog.log(tpl);
  }

  _dumpItemList (list) {
    let fastest = list.length > 1 ? filter(list, 'fastest') : null;
    let slowest = list.length > 2 ? filter(list, 'slowest') : null;
    let mean = _.sum(list, 'hz') / list.length;

    _.each(list, (item) => this._dumpItem(item, {fastest, slowest, mean}));
  }

  dumpEnv () {
    if (!this._dumpEnv) return false;

    var env = _.pick(process.versions, ['node', 'v8', 'zlib']);
    env.system = os.type() + ' ' + os.arch();
    env.cpu = _.first(os.cpus()).model + ' x' + os.cpus().length;
    ylog.ln.writeFlag(env, 'System environment');
  }

  dump (data) {
    this.dumpEnv();

    ylog.ln.title('latest benchmark : ');

    if (this.isSuite) {

      _.each(data.list, (suite) => {
        this._dumpItemList(suite);
        ylog.ln();
      });

    } else {
      let fastest = filter(data.list, 'fastest');
      this._dumpItemList(data.list);

      if (data.fastest.hz > fastest.hz) {
        ylog.ln.title('history fastest : ');
        this._dumpItem(data.fastest, {md: '~'});
      }
    }
  }

  _complete (listItem) {

    if (!this.enabled) {
      this[this.isSuite ? '_dumpItemList' : '_dumpItem'](listItem);
      return listItem;
    }

    let data = this.read();
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

  /**
   * 单个 bench 触发了 onComplete 事件
   * @param {Object} bench
   * @param {Event} event
   * @returns {{list: Array, fastest: Object}}
   */
  benchComplete (bench, event) {
    return this._complete(this.getBenchData(bench));
  }

  /**
   * benchmark suite 触发了 onComplete 事件
   * @param {Array} benchs
   * @param {Event} event
   * @returns {*}
   */
  suiteBenchComplete (benchs, event) {
    return this._complete(_.map(benchs, (bench) => this.getBenchData(bench)));
  }

}
