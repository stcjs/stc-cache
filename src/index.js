import {mkdir, isFile, promisify} from 'stc-helper';
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
    onlyMemory: false,
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
    this.onlyMemory = options.onlyMemory || false;
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
    let savePath = `${name[0]}/${name[1]}/${name}.json`;
    let p = path.join(this.path, savePath);
    mkdir(path.dirname(p));
    return p;
  }
  /**
   * get cache
   */
  get(name, encoding = 'utf8'){
    if(this.cache[name] !== undefined || this.onlyMemory){
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
    if(this.onlyMemory){
      return;
    }
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