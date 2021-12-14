export class BigInteger {
  static _base = 10;
  // In rowDec, there's a _base^compressDegree base number
  static compressDegree = 4;
  static realBase = this._base ** this.compressDegree;
  constructor(num) {
    this.rawDec = [];
    this.decimal = [];
    this.positive = true;
    if (num) {
      this.parse(num);
    }
  }

  clone() {
    const ret = new BigInteger(this.rawDec);
    ret.positive = this.positive;
    return ret;
  }

  parseNumber(_num) {
    if (_num < 0) {
      this.positive = false;
      _num = -_num;
    }
    let num = _num;
    this.rawDec = [];
    while (num !== 0) {
      this.rawDec.push(num % BigInteger.realBase);
      num = parseInt(num / BigInteger.realBase, BigInteger._base);
    }
  }

  parseString(_numStr) {
    if (_numStr[0] === '-') {
      _numStr = _numStr.slice(1);
      this.positive = false;
    }
    const trimLeadingZeroNum = this.trimLeadingZero(_numStr);
    let i;
    for (i = 0; i < trimLeadingZeroNum.length; i++) {
      if (trimLeadingZeroNum[i] === '.') {
        break;
      }
    }

    const numStr = [trimLeadingZeroNum.slice(0, i)];
    this.rawDec = [];
    let numIndex = numStr[0].length - 1;
    let rawDecIndex = 0;
    const digitStr = numStr[0];
    while (numIndex >= 0) {
      this.rawDec.push(0);
      rawDecIndex = this.rawDec.length - 1;
      const compressDegree = BigInteger.compressDegree;
      const base = BigInteger._base;

      let result = 0;
      for (i = compressDegree - 1; i >= 0; i--) {
        result = result * base + parseInt(digitStr[numIndex - i] ?? 0, base);
      }
      this.rawDec[rawDecIndex] = result;

      numIndex -= compressDegree;
    }
  }

  parse(num) {
    if (Array.isArray(num)) {
      this.rawDec = num;
      return;
    }
    switch (typeof (num)) {
      case 'number':
        this.parseNumber(num);
        this.positive = num > 0;
        break;
      case 'string':
        this.parseString(num);
        break;
      default:
        break;
    }
  }

  trimLeadingZero(numStr) {
    let i = 0;
    while (numStr[i] === '0') {
      i++;
    }
    const ret = numStr.slice(i);
    if (ret === '') return '0';
    return numStr.slice(i);
  }

  toString() {
    if (this.isZero()) {
      return '0';
    }
    const rawDecDummy = this.rawDec.slice(0);
    let result = '';
    while (rawDecDummy.length > 0) {
      let currentSegment = rawDecDummy.pop();
      let temp = '';
      for (let i = 0; i < BigInteger.compressDegree; i++) {
        const digit = currentSegment % BigInteger._base;
        temp = digit.toString() + temp;
        currentSegment = parseInt(currentSegment / BigInteger._base, BigInteger._base);
      }
      result += temp;
    }
    result = this.trimLeadingZero(result);
    if (this.positive === false) {
      result = `-${result}`;
    }
    return result;
  }
  inverse() {
    const result = new BigInteger(this.rawDec);
    result.positive = !this.positive;
    return result;
  }

  linearOp(_num, op, nextCarry, isSwap) {
    const realBase = BigInteger.realBase;
    let carry = 0;
    let selfArray = this.rawDec;
    let anotherArray = _num.rawDec;
    const result = [];
    if (isSwap) {
      const temp = selfArray;
      selfArray = anotherArray;
      anotherArray = temp;
    }
    for (let i = 0; i < selfArray.length || i < anotherArray.length; i++) {
      const segmentSelf = selfArray[i] ?? 0;
      const segmentAnother = anotherArray[i] ?? 0;
      const segmentResult = (op(segmentSelf, segmentAnother, carry) + realBase) % realBase;
      result.push(segmentResult);
      carry = nextCarry(op(segmentSelf, segmentAnother, carry));
    }
    result.push(carry);
    while (result[result.length - 1] === 0 && result.length > 1) {
      result.pop();
    }
    return new BigInteger(result);
  }
  add(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    if (this.positive && num.positive) {
      return this.linearOp(num, (first, second, carry) => first + second + carry, numPara => (numPara >= BigInteger.realBase ? 1 : 0));
    } else if (!this.positive && !num.positive) {
      return this.linearOp(num, (first, second, carry) => first + second + carry, numPara => (numPara >= BigInteger.realBase ? 1 : 0)).inverse();
    } else if (this.positive) {
      return this.minus(num.inverse());
    }
    return num.minus(this.inverse());
  }
  isZero() {
    for (const digit of this.rawDec) {
      if (digit !== 0) return false;
    }
    return true;
  }
  minus(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }

    if (!this.positive && !num.positive) {
      return num.inverse().minus(this);
    } else if (!this.positive && num.positive) {
      return this.inverse().add(num).inverse();
    } else if (this.positive && !num.positive) {
      return this.add(num.inverse());
    }

    const isSwap = !this.largerThan(num);
    const result = this.linearOp(num, (first, second, carry) => first - second - carry, numPara => (numPara < 0 ? 1 : 0), isSwap);
    if (isSwap) {
      result.positive = false;
    }
    while (result.rawDec[result.rawDec.length - 1] === 0 && result.rawDec.length > 1) {
      result.rawDec.pop();
    }
    return result;
  }
  multiply(_num) {
    // TODO: FFT
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    const base = BigInteger.realBase;
    const result = [];
    const anotherLen = num.rawDec.length;
    const selfLen = this.rawDec.length;
    const product = anotherLen + selfLen + 1;
    for (let i = 1; i <= product; i++) {
      result.push(0);
    }
    for (let i = 0; i < anotherLen; i++) {
      for (let j = 0; j < selfLen; j++) {
        let currentResult = result[i + j];
        const tempResult = currentResult + num.rawDec[i] * this.rawDec[j];
        result[i + j] = tempResult % base;
        const carry = parseInt(tempResult / base, 10);
        if (carry) {
          result[i + j + 1] += carry;
        }
      }
    }
    const ret = new BigInteger(result);
    ret.positive = !(this.positive ^ num.positive);
    while (ret.rawDec[ret.rawDec.length - 1] === 0 && ret.rawDec.length > 1) {
      ret.rawDec.pop();
    }
    return ret;
  }
  divide(_num) {
    const divideProcess = (base, number, a) => {
      let ansDigit = 0;
      while (true) {
        const b = a.minus(base);
        if (!b.positive && !b.isZero()) {
          break;
        }
        ansDigit += number;
        a = b;
      }
      return [ansDigit, a];
    };

    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    const start = this.rawDec.length - num.rawDec.length;
    if (start < 0) {
      return {
        quotient: new BigInteger(0),
        remainder: this,
      };
    }
    let a = new BigInteger(this.rawDec.slice(start));
    let ans = '';
    const thousand = new BigInteger();
    thousand.rawDec.push(1000);

    const hundred = new BigInteger();
    hundred.rawDec.push(100);

    const ten = new BigInteger();
    ten.rawDec.push(10);

    for (let i = start; i >= 0; i--) {
      let ansDigit = 0;
      let [result, temp] = divideProcess(num.multiply(thousand), 1000, a);
      ansDigit += result;
      a = temp;
      [result, temp] = divideProcess(num.multiply(hundred), 100, a);
      ansDigit += result;
      a = temp;
      [result, temp] = divideProcess(num.multiply(ten), 10, a);
      ansDigit += result;
      a = temp;
      [result, temp] = divideProcess(num, 1, a);
      ansDigit += result;
      a = temp;

      let ansDigitStr = ansDigit.toString();
      while (ansDigitStr.length < BigInteger.compressDegree) {
        ansDigitStr = `0${ansDigitStr}`;
      }
      ans += ansDigitStr;
      if (i > 0) {
        a.rawDec.unshift(0);
        a.rawDec[0] = this.rawDec[i - 1];
      }
      while (a.rawDec[a.rawDec.length - 1] === 0 && a.rawDec.length > 1) {
        a.rawDec.pop();
      }
      a.positive = true;
    }
    const retBigInteger = new BigInteger(ans);
    retBigInteger.positive = !(this.positive ^ num.positive);
    return {
      quotient: retBigInteger,
      remainder: a,
    };
  }
  largerThan(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    while (num.rawDec[num.rawDec.length - 1] === 0 && num.rawDec.length > 1) {
      num.rawDec.pop();
    }
    while (this.rawDec[this.rawDec.length - 1] === 0 && this.rawDec.length > 1) {
      this.rawDec.pop();
    }
    if (num.rawDec.length !== this.rawDec.length) {
      return (this.rawDec.length > num.rawDec.length);
    }
    for (let i = num.rawDec.length - 1; i >= 0; i--) {
      if (this.rawDec[i] !== num.rawDec[i]) {
        return this.rawDec[i] > num.rawDec[i];
      }
    }
    return false;
  }
  isEqual(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    while (num.rawDec[num.rawDec.length - 1] === 0 && num.rawDec.length > 1) {
      num.rawDec.pop();
    }
    while (this.rawDec[this.rawDec.length - 1] === 0 && this.rawDec.length > 1) {
      this.rawDec.pop();
    }
    if (num.rawDec.length !== this.rawDec.length) {
      return false;
    }
    for (let i = num.rawDec.length - 1; i >= 0; i--) {
      if (this.rawDec[i] !== num.rawDec[i]) {
        return false;
      }
    }
    if (num.positive !== this.positive) {
      return false;
    }
    return true;
  }
  gcd(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    let a = this;
    let b = num;
    while (!b.isZero()) {
      const remainder = a.divide(b).remainder;
      a = b;
      b = remainder;
    }
    return a;
  }
}