const hf = require("./hash_functions.js");
class BloomFilter {
  _hashFunctions = [];
  _filter = [];
  constructor(m, hashFunctions) {
    if (hashFunctions != undefined) {
      this._hashFunctions = hashFunctions;
    } else {
      this._hashFunctions.push(
        new hf.SuperFastHash(),
        new hf.MurmurHash3(),
        new hf.FNVHash(),
        new hf.JenkinsHash(),
        new hf.Djb2Hash()
      );
    }
    this._filter = new Array(m);
    this._filter.fill(0);
  }
  add(element) {
    for (let i = 0; i < this._hashFunctions.length; i++) {
      const hash = this._hashFunctions[i].hashToInt(element);
      this._filter[hash % this._filter.length] = 1;
    }
  }
  lookup(element) {
    for (let i = 0; i < this._hashFunctions.length; i++) {
      const hash = this._hashFunctions[i].hashToInt(element);
      if (this._filter[hash % this._filter.length] == 0) {
        return false;
      }
    }
    return true;
  }

  count() {
    console.log(this._filter.filter((x) => x == 0).length);
    let count = 0;
    for (let i = 0; i < this._filter.length; i++) {
      if (this._filter[i] == 1) {
        count++;
      }
    }
    if (count < this._hashFunctions.length) {
      return count;
    }
    if (count == this._hashFunctions.length) {
      return 1;
    }
    if (count == this._filter.length) {
      return this._filter.length / this._hashFunctions.length;
    }
    return (
      (-this._filter.length / this._hashFunctions.length) *
      Math.log(1 - count / this._filter.length)
    );
  }
  falsePositive() {
    return Math.pow(
      1 -
        Math.pow(
          Math.E,
          (-this._hashFunctions.length * this.count()) / this._filter.length
        ),
      this._hashFunctions.length
    );
  }
}

class CountingBloomFilter extends BloomFilter {
  _counts = [];
  constructor(m, hashFunctions) {
    super(m, hashFunctions);
    this._counts = new Array(m);
    this._counts.fill(0);
  }
  add(element) {
    for (let i = 0; i < this._hashFunctions.length; i++) {
      const hash = this._hashFunctions[i].hashToInt(element);
      let j = hash % this._filter.length;
      this._counts[j]++;
      if (this._counts[j] == 1) {
        this._filter[j] = 1;
      }
    }
  }
  lookup(element) {
    for (let i = 0; i < this._hashFunctions.length; i++) {
      const hash = this._hashFunctions[i].hashToInt(element);
      if (this._filter[hash % this._filter.length] == 0) {
        return false;
      }
    }
    return true;
  }
  remove(element) {
    for (let i = 0; i < this._hashFunctions.length; i++) {
      const hash = this._hashFunctions[i].hashToInt(element);
      let j = hash % this._filter.length;
      this._counts[j]--;
      if (this._counts[j] == 0) {
        this._filter[j] = 0;
      }
    }
  }
}

class QuotientFilter {
  _filter = [];
  _hashFunction = new hf.MurmurHash3();
  constructor(n, hashFunction) {
    this._filter = new Array(n);
    for (let i = 0; i < n; i++) {
      this._filter[i] = {
        fr: null,
        is_shift: false,
        is_continuation: false,
        is_occupied: false,
      };
    }
    if (hashFunction != undefined) {
      this._hashFunction = hashFunction;
    }
  }

  #shiftRight(k) {
    let prev = this._filter[k];
    let i = k + 1;
    while (true) {
      if (this._filter[i].fr == null) {
        this._filter[i].fr = prev.fr;
        this._filter[i].is_shift = true;
        this._filter[i].is_continuation = true;
        return;
      } else {
        let current = { ...this._filter[i] };
        this._filter[i] = { ...prev };
        prev = { ...current };
      }
      i++;
      if (i > this._filter.length) {
        i = 0;
      }
    }
  }

  #scan(fq) {
    let j = fq;
    while (this._filter[j].is_shift) {
      j--;
    }
    let rStart = j;
    while (j != fq) {
      do {
        rStart++;
      } while (this._filter[rStart].is_continuation != true);
      do {
        j++;
      } while (this._filter[j].is_occupied == true);
    }
    let rEnd = rStart;
    do {
      rEnd++;
    } while (
      this._filter[rEnd] == undefined ||
      this._filter[rEnd].is_continuation != true
    );
    return [rStart, rEnd];
  }
  add(value) {
    let f = this._hashFunction.hashToInt(value);
    let fr = f % this._filter.length;
    let fq = Math.floor(f / this._filter.length);
    if (this._filter[fq].is_occupied != true && this._filter[fq].fr == null) {
      this._filter[fq].fr = fr;
      this._filter[fq].is_occupied = true;
      return true;
    }
    this._filter[fq].is_occupied = true;
    const [rStart, rEnd] = this.#scan(fq);
    for (let i = rStart; i < rEnd; i++) {
      if (this._filter[i].fr == fr) {
        return True;
      } else if (this._filter[i].fr > fr) {
        this.#shiftRight(i);
        this._filter[i].fr = fr;
        return true;
      }
    }
    this.#shiftRight(rEnd + 1);
    this._filter[rEnd + 1].fr = fr;
    return true;
  }
  lookup(value) {
    let f = this._hashFunction.hashToInt(value);
    let fr = f % this._filter.length;
    let fq = Math.floor(f / this._filter.length);
    if (this._filter[fq].is_occupied != true) {
      return false;
    } else {
      const [rStart, rEnd] = this.#scan(fq);
      for (let i = rStart; i < rEnd; i++) {
        if (this._filter[i].fr == fr) {
          return true;
        }
      }
      return false;
    }
  }
}

let quotientFilter = new QuotientFilter(100);
quotientFilter.add("a");
quotientFilter.add("b");
console.log(quotientFilter.lookup("a"));
console.log(quotientFilter.lookup("f"));
