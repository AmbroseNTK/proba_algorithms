const hf = require("./hash_functions");
const nch = require("non-crypto-hash");
const uuid = require("uuid").v4;

class LinearCounter {
  _list = [];
  _hashFunction = new hf.FNVHash();
  constructor(m, hashFunction) {
    if (hashFunction != undefined) {
      this._list = hashFunction;
    }
    this._list.length = m;
    this._list.fill(0);
  }
  add(element) {
    let hash = this._hashFunction.hashToInt(element) % this._list.length;
    if (this._list[hash] == 0) {
      this._list[hash] = 1;
    }
  }
  estimate() {
    let z = this._list.filter((x) => x == 0).length;
    return Math.floor(-this._list.length * Math.log(z / this._list.length));
  }
  static createBySize(maxN) {
    if (maxN < 1000) {
      return new LinearCounter(5329);
    } else if (maxN < 10000) {
      return new LinearCounter(7960);
    } else if (maxN < 100000) {
      return new LinearCounter(26729);
    } else if (maxN < 1000000) {
      return new LinearCounter(154171);
    } else if (maxN < 10000000) {
      return new LinearCounter(1096582);
    }

    return new LinearCounter(8571013);
  }
}

class SimpleCounter {
  filter = [];
  _hashFunction = nch.createHash("murmurhash3");
  constructor(m, hashFunction) {
    if (hashFunction != undefined) {
      this.filter = hashFunction;
    }
    this.filter.length = m;
    this.filter.fill(0);
  }
  static rank(hash) {
    let bin = hash.toString(2);

    console.log(bin);
    for (let i = bin.length - 1; i >= 0; i--) {
      if (bin[i] == 1) {
        return bin.length - i - 1;
      }
    }
  }
  add(element) {
    let hash = parseInt(
      this._hashFunction.x86Hash32(element.toString(), 2303),
      16
    );
    let rank = SimpleCounter.rank(hash);
    this.filter[rank] = 1;
  }
  estimate() {
    for (let i = 0; i < this.filter.length; i++) {
      if (this.filter[i] == 0) {
        return (1 / 0.77351) * Math.pow(2, i);
      }
    }
  }
}

class FlajoletMartinCounter {
  _counter = [];
  _hashFunction = nch.createHash("murmurhash3");
  constructor(m) {
    this._counter = new Array(m);
    for (let i = 0; i < m; i++) {
      this._counter[i] = new SimpleCounter(m);
    }
  }
  add(element) {
    let hash = parseInt(
      this._hashFunction.x86Hash32(element.toString(), 2303),
      16
    );
    let r = hash % this._counter.length;
    let q = Math.floor(hash / this._counter.length);
    let rank = SimpleCounter.rank(q);
    this._counter[r].filter[rank] = 1;
  }
  estimate() {
    let s = 0;
    for (let i = 0; i < this._counter.length; i++) {
      let r = 0;
      for (r = 0; r < this._counter[i].filter.length; r++) {
        if (this._counter[i].filter[r] == 0) {
          break;
        }
      }
      s += r;
    }
    return (
      (this._counter.length / 0.77351) *
      Math.pow(2, (1 / this._counter.length) * s)
    );
  }
}

let counter = new FlajoletMartinCounter(32);
for (let i = 0; i < 10000; i++) {
  counter.add(uuid());
}
console.log(counter.estimate());
