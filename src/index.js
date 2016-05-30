import {mkdir, isFile, promisify} from 'stc-helper';
import os from 'os';
import path from 'path';
import fs from 'fs';

//home path
const homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const tmpPath = os.tmpdir();

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
    handle: JSON
  }){
    if(typeof options === 'string'){
      options = {type: options};
    }
    this.options = options;
    this.path = this.getStorePath();
    this.cache = {};
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
   * get cache
   */
  get(name, encoding = 'utf8'){
    if(this.cache[name]){
      return Promise.resolve(this.cache[name]);
    }
    if(!this.path){
      return Promise.resolve('');
    }
    let filePath = path.join(this.path, name);
    if(!isFile(filePath)){
      return Promise.resolve('');
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
      console.log('get cache error: ', name);
    });
  }
  /**
   * set cache
   */
  set(name, value){
    this.cache[name] = value;
    if(!this.path){
      return Promise.resolve('');
    }
    let filePath = path.join(this.path, name);
    let fn = promisify(fs.writeFile, fs);
    value = this.handle.stringify(value);
    return fn(filePath, value).catch(() => {
      console.log('set cache error: ', name);
    });
  }
}