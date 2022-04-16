const nch = require("non-crypto-hash");
const fnv = require("fnv-plus");
const jenkins = require("jenkins-hash").hashlittle;
const djb2 = require("string-hash");

class HashFunction {
  hashToInt(value) {}
}

class SuperFastHash extends HashFunction {
  _fn = null;

  constructor() {
    super();
    this._fn = nch.createHash("superfasthash");
  }

  hashToInt(value) {
    return parseInt(this._fn.hash(value.toString(), 2303), 16);
  }
}

class MurmurHash3 extends SuperFastHash {
  constructor() {
    super();
    this._fn = nch.createHash("murmurhash3");
  }
}

class FNVHash extends HashFunction {
  constructor() {
    super();
    this._fn = fnv;
  }

  hashToInt(value) {
    return parseInt(this._fn.hash(value.toString()).dec(), 10);
  }
}

class JenkinsHash extends HashFunction {
  constructor() {
    super();
    this._fn = jenkins;
  }
  hashToInt(value) {
    return this._fn(value.toString(), 0x2303);
  }
}

class Djb2Hash extends HashFunction {
  constructor() {
    super();
    this._fn = djb2;
  }
  hashToInt(value) {
    return this._fn(value.toString());
  }
}

module.exports = {
  HashFunction,
  SuperFastHash,
  MurmurHash3,
  FNVHash,
  JenkinsHash,
  Djb2Hash,
};
