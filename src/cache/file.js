import Base from './base';
import fs from 'fs-extra';
import path from 'path';

export default class extends Base {
  constructor(compressor, env) {
    super(compressor);

    this.rootDir = env.CACHE_STORE_PATH || '/tmp/sparql-proxy/cache';

    console.log(`cache directory is ${this.rootDir}`);
  }

  async get(key) {
    const _path = this.getPath(key);

    try {
      const data = await fs.readFile(_path);

      return await this.deserialize(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      } else {
        throw error;
      }
    }
  }

  async put(key, obj) {
    const _path = this.getPath(key);
    const data  = await this.serialize(obj);

    await fs.ensureDir(path.dirname(_path));
    await fs.writeFile(_path, data);
  }

  async purge() {
    await fs.remove(this.rootDir);
  }

  getPath(key) {
    return path.join(this.rootDir, key.slice(0, 2), key.slice(2, 4), key);
  }
}
