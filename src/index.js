import {mkdir, isFile, promisify, md5} from 'stc-helper';
import os from 'os';
import path from 'path';
import fs from 'fs';

//home path
const homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const tmpPath = os.tmpdir();
const noop = () => {};

/**
 * cache
 */
export default class Cache {
  /**
   * constructor
   */
  constructor(options = {
    path: '',
    type: 'default',
    handle: null,
    logger: null
  }){
    if(typeof options === 'string'){
      options = {type: options};
    }
    this.options = options;
    this.path = this.getStorePath();
    this.cache = {};
    this.handle = options.handle || JSON;
    this.logger = options.logger || noop;
  }
  /**
   * get store path
   */
  getStorePath(){
    let p = '.stc/' + this.options.type;
    let list = [
      path.join(homePath, p),
      path.join(tmpPath, p)
    ];
    if(this.options.path){
      list.unshift(path.join(this.options.path, p));
    }
    for(let i = 0, length = list.length; i < length; i++){
      let item = list[i];
      if(mkdir(item)){
        return item;
      }
    }
  }
  /**
   * get saved file path
   */
  getSavedFilePath(name){
    if(!this.path){
      return;
    }
    let key = md5(name);
    let savePath = `${key[0]}/${key[1]}/${key}.json`;
    let p = path.join(this.path, savePath);
    mkdir(path.dirname(p));
    return p;
  }
  /**
   * get cache
   */
  get(name, encoding = 'utf8'){
    if(this.cache[name]){
      return Promise.resolve(this.cache[name]);
    }
    let filePath = this.getSavedFilePath(name);
    if(!filePath || !isFile(filePath)){
      return Promise.resolve();
    }
    let fn = promisify(fs.readFile, fs);
    return fn(filePath, encoding).then(data => {
      if(!data){
        return;
      }
      data = this.handle.parse(data);
      this.cache[name] = data;
      return data;
    }).catch(() => {
      this.logger(new Error(`get cache error ${name}`));
    });
  }
  /**
   * set cache
   */
  set(name, value){
    this.cache[name] = value;
    let filePath = this.getSavedFilePath(name);
    if(!filePath){
      return;
    }
    let fn = promisify(fs.writeFile, fs);
    value = this.handle.stringify(value);
    return fn(filePath, value).catch(() => {
      this.logger(new Error(`set cache error ${name}`));
    });
  }
}