class BigInteger {
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


const LEX_STATE = {
  VACANT: 0,
  RECEIVED_FUNC: 1,
  RECEIVED_NUM: 2,
};

class Token {
  constructor(type, content) {
    this.type = type;
    this.content = content;
  }
}

class ParseResult {
  constructor(index, type, ast, value) {
    this.index = index;
    this.type = type;
    this.ast = ast;
    this.value = value;
  }
}

class ASTNode {
  constructor(type, childNode, value) {
    this.symbols = new Set();
    this.child = childNode;
    this.value = value;
    this.type = type;
  }
}

class IntegerASTNode extends ASTNode {
  constructor(value) {
    super('integer', null);
    if (value.rawDec) {
      this.obj = value.toString();
      this.value = value;
    }
    this.obj = value;
  }
  compute() {
    const ret = this.clone();
    ret.value = this.value ?? new BigInteger(this.obj);
    return ret;
  }
  toString(isNeededBracket) {
    if (!this.value) {
      this.value = new BigInteger(this.obj);
    }
    let ret = this.value.toString();
    this.obj = ret;
    if (this.value.positive === false && !this.value.isZero()) {
      if (isNeededBracket) {
        ret = `(${ret})`;
      }
    }
    return ret;
  }
  clone() {
    return new IntegerASTNode(this.obj);
  }
  derivative() {
    const result = new IntegerASTNode('0');
    return result;
  }
}

class SymbolASTNode extends ASTNode {
  constructor(symbolName) {
    super('symbol');
    this.symbolName = symbolName;
    this.symbols.add(symbolName);
  }
  getSimplify() {
    return this;
  }
  compute() {
    const ret = this.clone();
    return ret;
  }
  toString() {
    return this.symbolName;
  }
  clone() {
    return new SymbolASTNode(this.symbolName);
  }
  derivative(symbol) {
    let result;
    if (this.symbolName === symbol) {
      result = new IntegerASTNode('1');
    } else {
      result = new IntegerASTNode('0');
    }
    return result;
  }
}


class UnaryASTNode extends ASTNode {
  constructor(type, child) {
    super(type, child, null);
  }
  getSimplify() {
    if (this.type === 'positive') {
      return this.child;
    }
    if (this.child.type === 'negative') {
      return this.child.child;
    }
    return this;
  }

  compute() {
    let temp = this.child.compute();
    if (temp.type === 'integer') {
      temp = temp.compute();
      if (this.type === 'negative') {
        temp.value.positive = !temp.value.positive;
        temp.obj = temp.value.toString();
      }
      return temp;
    }
    const ret = new UnaryASTNode(this.type, temp);
    for (const element of temp.symbols) {
      ret.symbols.add(element);
    }
    return ret.getSimplify();
  }
  toString(isNeededBracket) {
    if (this.strRaw) {
      return this.strRaw;
    }
    const temp = this.child.toString();
    if (this.type === 'positive') {
      this.strRaw = `+${temp}`;
    } else if (this.type === 'negative') {
      this.strRaw = `-${temp}`;
    }
    if (isNeededBracket) {
      return `(${this.strRaw})`;
    }
    return this.strRaw;
  }
  clone() {
    return new UnaryASTNode(this.type, this.child.clone());
  }
  derivative(symbol) {
    return new UnaryASTNode(this.type, this.child.derivative(symbol));
  }
}


class TermASTNode extends ASTNode {
  constructor(value) {
    super('term', []);
    if (value) {
      this.add('add', value);
    }
  }
  add(type, value) {
    this.child.push({ type, value });
  }

  combine() {
    const childStrMap = new Map();
    this.child.forEach((term) => {
      const str = term.value.toString();
      const count = childStrMap.get(str);
      if (count) {
        childStrMap.set(str, count + 1);
        if (term.type === 'add') {
          childStrMap.set(str, count + 1);
        } else {
          childStrMap.set(str, count - 1);
        }
      } else {
        if (term.type === 'add') {
          childStrMap.set(str, 1);
        } else {
          childStrMap.set(str, -1);
        }
      }
    });
    const newChild = [];
    this.child.forEach((term) => {
      const str = term.value.toString();
      const count = childStrMap.get(str);
      if (count === 0) {
        return;
      }
      if (count === 1) {
        term.type = 'add';
        newChild.push(term);
      } else if (count === -1) {
        term.type = 'minus';
        newChild.push(term);
      } else {
        const result = new FactorASTNode();
        result.add('multiply', new IntegerASTNode(count.toString()));
        result.add('multiply', term.value);
        term.value = result;
        term.type = 'add';
        newChild.push(term);
      }
      childStrMap.set(str, 0);
    });
    this.child = newChild;
  }

  getSimplify() {
    const addChild = this.child?.filter(child => child.value.type === 'term' && child.type === 'add');
    this.child = this.child?.filter(child => child.value.type !== 'term' || child.type !== 'add');

    addChild.forEach((term) => {
      term.value.child.forEach((child) => {
        this.child.push(child);
      });
    });

    this.child = this.child?.filter((child) => {
      if (child.value.type === 'integer') {
        return !child.value?.value?.isZero();
      }
      return true;
    });

    this.combine();

    if (this.child.length === 1) {
      if (this.child[0].type === 'add') {
        return this.child[0].value;
      }
      return new UnaryASTNode('negative', this.child[0].value);
    }
    if (this.child.length === 0) {
      return new IntegerASTNode('0').compute();
    }

    this.child.forEach((child) => {
      if (child.value.type === 'positive') {
        child.value = child.value.child;
      } else if (child.value.type === 'negative') {
        child.value = child.value.child;
        if (child.type === 'add') {
          child.type = 'minus';
        } else {
          child.type = 'add';
        }
      }
    });
    return this;
  }
  compute() {
    this.getSimplify();
    const ret = new TermASTNode();
    const addList = this.child.filter(x => x.type === 'add').map(x => x.value.compute());
    const minusList = this.child.filter(x => x.type === 'minus').map(x => x.value.compute());

    const incomputableMinusList = minusList.filter(x => x.type !== 'integer');
    const integerMinus = minusList.filter(x => x.type === 'integer').reduce((x, y) => {
      const result = x.value.add(y.compute().value);
      const _ret = new IntegerASTNode(result.toString());
      _ret.value = result;
      return _ret.compute();
    }, new IntegerASTNode('0').compute());

    integerMinus.value.positive = !integerMinus.value.positive;

    const incomputableAddList = addList.filter(x => x.type !== 'integer');
    const integerAdd = addList.filter(x => x.type === 'integer').reduce((x, y) => {
      const result = x.value.add(y.compute().value);
      const _ret = new IntegerASTNode(result.toString());
      _ret.value = result;
      return _ret.compute();
    }, integerMinus);


    if (integerAdd.value.positive === true) {
      ret.add('add', integerAdd);
    } else {
      integerAdd.value.positive = true;
      integerAdd.obj = integerAdd.value.toString();
      ret.add('minus', integerAdd);
    }
    incomputableAddList.forEach((x) => {
      for (const element of x.symbols) {
        ret.symbols.add(element);
      }
      ret.add('add', x);
    });

    incomputableMinusList.forEach((x) => {
      for (const element of x.symbols) {
        ret.symbols.add(element);
      }
      ret.add('minus', x);
    });
    return ret.getSimplify();
  }

  toString() {
    if (this.strRaw) {
      return this.strRaw;
    }
    for (let i = 0, j = 0; i < this.child.length; i++) {
      if (this.child[i].type === 'add') {
        if (i !== j) {
          const temp = this.child[i];
          this.child[i] = this.child[j];
          this.child[j] = temp;
        }
        j++;
      }
    }
    let result = this.child[0].value.toString();
    if (this.child[0].type === 'minus') {
      result = `-${result}`;
    }
    for (let i = 1; i < this.child.length; i++) {
      const another = this.child[i].value.toString();
      switch (this.child[i].type) {
        case 'add':
          result += ` + ${another}`;
          break;
        case 'minus':
          result += ` - ${another}`;
          break;
        default:
          break;
      }
    }
    this.strRaw = `(${result})`;
    return this.strRaw;
  }
  clone() {
    const ret = new TermASTNode();
    for (let i = 0; i < this.child.length; i++) {
      ret.add(this.child[i].type, this.child[i].value.clone());
    }
    return ret;
  }
  derivative(symbol) {
    const ret = this.clone();
    ret.child = ret.child.map((x) => {
      x.value = x.value.derivative(symbol);
      return x;
    });
    return ret.getSimplify();
  }
}


class FactorASTNode extends ASTNode {
  constructor(value) {
    super('factor', []);
    if (value) {
      this.add('multiply', value);
    }
  }
  add(type, value) {
    this.child.push({ type, value });
  }

  combine() {
    const childStrMap = new Map();
    this.child.forEach((factor) => {
      let str = factor.value.toString();
      let num = new BigInteger(1);
      if (factor.value.type === 'Exponent' && factor.value.power.type === 'integer') {
        str = factor.value.base.toString();
        num = factor.value.power.compute().value;
      }
      const count = childStrMap.get(str);
      if (count) {
        childStrMap.set(str, count.add(num));
        if (factor.type === 'multiply') {
          childStrMap.set(str, count.add(num));
        } else {
          childStrMap.set(str, count.minus(num));
        }
      } else {
        if (factor.type === 'multiply') {
          childStrMap.set(str, num);
        } else {
          childStrMap.set(str, num.inverse());
        }
      }
    });
    const newChild = [];
    this.child.forEach((factor) => {
      let str = factor.value.toString();
      let base = factor.value;
      if (factor.value.type === 'Exponent' && factor.value.power.type === 'integer') {
        str = factor.value.base.toString();
        base = factor.value.base;
      }

      const count = childStrMap.get(str);
      if (count.isZero()) {
        return;
      }
      if (count.isEqual(1)) {
        newChild.push({ type: 'multiply', value: base });
      } else if (count.isEqual(-1)) {
        newChild.push({ type: 'divide', value: base });
      } else {
        const result = new ExponentASTNode(base);
        result.add(new IntegerASTNode(count.toString()));
        factor.value = result;
        factor.type = 'multiply';
        newChild.push(factor);
      }
      childStrMap.set(str, new BigInteger(0));
    });
    this.child = newChild;
  }

  getSimplify() {
    const factorChild = this.child?.filter(child => child.value.type === 'factor' && child.type === 'multiply');
    this.child = this.child?.filter(child => child.value.type !== 'factor' || child.type !== 'multiply');

    factorChild.forEach((factor) => {
      factor.value.child.forEach((child) => {
        this.child.push(child);
      });
    });
    this.child = this.child?.filter((child) => {
      if (child.value.type === 'integer') {
        return child.value?.obj !== '1';
      }
      return true;
    });
    const zero = this.child?.filter((child) => {
      if (child.value.type === 'integer') {
        return child.value?.obj === '0';
      }
      return false;
    });
    if (zero.length > 0) {
      return new IntegerASTNode('0').compute();
    }
    if (this.child.length === 0) {
      return new IntegerASTNode('1').compute();
    }

    this.combine();
    if (this.child.length === 1 && this.child[0].type === 'multiply') {
      return this.child[0].value;
    }
    if (this.child.length === 0) {
      return new IntegerASTNode('1').compute();
    }

    let negativeCount = 0;
    this.child?.forEach((child) => {
      if (child.value.type === 'negative') {
        child.value = child.value.child;
        negativeCount++;
      } else if (child.value.type === 'positive') {
        child.value = child.value.child;
      } else if (child.value.type === 'integer' && child.value.compute().value.positive === false) {
        child.value.value.positive = true;
        child.value.obj = child.value.value.toString();
        negativeCount++;
      }
    });

    this.child = this.child?.filter((child) => {
      if (child.value.type === 'integer') {
        return child.value?.obj !== '1';
      }
      return true;
    });
    if (negativeCount & 1) {
      return new UnaryASTNode('negative', this);
    }

    return this;
  }
  compute() {
    const ret = new FactorASTNode();
    const multiplyList = this.child.filter(x => x.type === 'multiply').map(x => x.value.compute());
    const divideList = this.child.filter(x => x.type === 'divide').map(x => x.value.compute());

    const incomputableMultiplyList = multiplyList.filter(x => x.type !== 'integer');
    let integerMultiplyList = multiplyList.filter(x => x.type === 'integer').reduce((x, y) => {
      const result = x.value.multiply(y.value);
      const _ret = new IntegerASTNode(result.toString());
      _ret.value = result;
      return _ret;
    }, new IntegerASTNode('1').compute());

    const incomputableDivideList = divideList.filter(x => x.type !== 'integer');
    let integerDivideList = divideList.filter(x => x.type === 'integer').reduce((x, y) => {
      const result = x.value.multiply(y.value);
      const _ret = new IntegerASTNode(result.toString());
      _ret.value = result;
      return _ret;
    }, new IntegerASTNode('1').compute());

    const gcd = integerMultiplyList.value.gcd(integerDivideList.value);
    if (gcd.rawDec && gcd.rawDec[0] !== 1) {
      integerMultiplyList = new IntegerASTNode(integerMultiplyList.value.divide(gcd).quotient.toString());
      integerDivideList = new IntegerASTNode(integerDivideList.value.divide(gcd).quotient.toString());
    }

    ret.add('multiply', integerMultiplyList);
    incomputableMultiplyList.forEach((x) => {
      for (const element of x.symbols) {
        ret.symbols.add(element);
      }
      ret.add('multiply', x);
    });

    ret.add('divide', integerDivideList);
    incomputableDivideList.forEach((x) => {
      for (const element of x.symbols) {
        ret.symbols.add(element);
      }
      ret.add('divide', x);
    });
    return ret.getSimplify();
  }
  derivative(symbol) {
    const multiplyList = this.child.filter(x => x.type === 'multiply').map(x => x.value.compute());
    const divideList = this.child.filter(x => x.type === 'divide').map(x => x.value.compute());
    let numeratorDerivative = new TermASTNode();
    let numerator = new FactorASTNode();
    multiplyList.forEach((element) => {
      numerator.add('multiply', element);
    });
    numerator = numerator.compute();
    if (numerator.type !== 'factor') {
      numeratorDerivative = numerator.derivative('x').compute();
    } else {
      for (let i = 0; i < multiplyList.length; i++) {
        const term = numerator.clone();
        term.child[i].value = term.child[i].value.derivative(symbol).compute();
        numeratorDerivative.add('add', term);
      }
    }
    numeratorDerivative = numeratorDerivative.compute();
    if (divideList.length === 0) {
      return numeratorDerivative.compute();
    }

    let denominator = new FactorASTNode();
    divideList.forEach((element) => {
      denominator.add('multiply', element);
    });
    denominator = denominator.compute();

    const denominatorDerivative = denominator.derivative(symbol).compute();
    const a = new FactorASTNode(numeratorDerivative);
    a.add('multiply', denominator);
    const b = new FactorASTNode(denominatorDerivative);
    b.add('multiply', numerator);
    const c = new TermASTNode(a);
    c.add('minus', b);

    const d = new ExponentASTNode(denominator.clone(), new IntegerASTNode('2'));
    const result = new FactorASTNode(c.compute());
    result.add('divide', d.compute());
    return result.compute();
  }
  clone() {
    const ret = new FactorASTNode();
    for (let i = 0; i < this.child.length; i++) {
      ret.add(this.child[i].type, this.child[i].value.clone());
    }
    return ret;
  }

  toString() {
    if (this.strRaw) {
      return this.strRaw;
    }
    const multiplyList = this.child.filter(x => x.type === 'multiply');
    const divideList = this.child.filter(x => x.type === 'divide');
    let result;
    if (multiplyList.length === 0) {
      result = '1';
      for (let i = 0; i < divideList.length; i++) {
        result += ` / ${divideList[i].value.toString(true)}`;
      }
      return result;
    }

    result = multiplyList[0].value.toString(true);
    for (let i = 1; i < multiplyList.length; i++) {
      const factor = multiplyList[i].value.toString(true);
      result = `${result} * ${factor}`;
    }
    for (let i = 0; i < divideList.length; i++) {
      const factor = divideList[i].value.toString(true);
      result = `${result} / ${factor}`;
    }

    this.strRaw = result;
    return this.strRaw;
  }
}

class ExponentASTNode extends ASTNode {
  constructor(base, power) {
    super('Exponent', null);
    this.base = base;
    this.power = power;
  }
  add(power) {
    this.power = power;
  }
  getSimplify() {
    if (!this.power) {
      return this.base;
    }
    if (this.power.type === 'integer' && this.power?.obj === '1') {
      return this.base;
    }
    return this;
  }
  quickPower(base, power) {
    if (power.isZero()) {
      return new BigInteger(1);
    }
    if (power.rawDec[0] & 1) {
      return base.multiply(this.quickPower(base, power.minus(1)));
    }
    const temp = this.quickPower(base, power.divide(2).remainder);
    return temp.multiply(temp);
  }
  compute() {
    const base = this.base.compute();
    const power = this.power.compute();
    if (base.type === 'integer' && power.type === 'integer') {
      let result = new BigInteger(1);
      if (power.value.positive) {
        result = this.quickPower(base.value, power.value);
      } else {
        const ret = new FactorASTNode();
        result = this.quickPower(base.value, power.value.inverse());
        ret.add('divide', new IntegerASTNode(result.toString()));
        return ret;
      }
      return new IntegerASTNode(result.toString());
    }
    const ret = new ExponentASTNode(base, power).getSimplify();
    for (const element of base.symbols) {
      ret.symbols.add(element);
    }
    for (const element of power.symbols) {
      ret.symbols.add(element);
    }
    return ret.getSimplify();
  }

  toString() {
    if (this.strRaw) {
      return this.strRaw;
    }
    let base = this.base.toString(true);
    let power = this.power.toString(true);
    if (this.base.type === 'Exponent' || this.base.type === 'factor') {
      base = `(${base})`;
    }
    if (this.power.type === 'Exponent' || this.power.type === 'factor') {
      power = `(${power})`;
    }
    this.strRaw = `${base} ^ ${power}`;
    return this.strRaw;
  }
  clone() {
    return new ExponentASTNode(this.base, this.power);
  }
  derivative(symbol) {
    if (!this.base.symbols.has(symbol) && !this.power.symbols.has(symbol)) {
      return new IntegerASTNode('1');
    }
    if (!this.power.symbols.has(symbol)) {
      const result = new FactorASTNode();
      result.add('multiply', this.power.clone());
      const minusOne = new TermASTNode(this.power.clone());
      minusOne.add('minus', new IntegerASTNode('1'));
      result.add('multiply', new ExponentASTNode(this.base, minusOne));
      return result;
    }
    if (!this.base.symbols.has(symbol)) {
      const result = new FactorASTNode();
      result.add('multiply', this.power.derivative('x'));
      result.add('multiply', this.clone());
      result.add('multiply', new FunctionASTNode('ln', this.base.compute()));
      return result;
    }
    const result = new FactorASTNode(this.clone());
    const rightPart = new FactorASTNode(this.power.clone());
    rightPart.add('multiply', new FunctionASTNode('ln', this.base.compute()));
    result.add('multiply', rightPart.derivative('x'));
    return result.compute();
  }
}

class FunctionASTNode extends ASTNode {
  constructor(functionName, parameter) {
    super('function');
    this.parameter = parameter;
    this.functionName = functionName;
  }
  getSimplify() {
    let ret = this;
    switch (this.functionName) {
      case 'sin':
        if (this.parameter.type === 'negative') {
          ret = new FunctionASTNode('sin', this.parameter.child);
          ret.symbols = this.symbols;
          ret = new UnaryASTNode('negative', ret);
          ret.symbols = this.symbols;
        }
        break;
      case 'exp':
        break;
      case 'cos':
        if (this.parameter.type === 'negative') {
          this.parameter = this.parameter.child;
        }
        break;
      case 'ln':
        if (this.parameter.type === 'Exponent') {
          ret = new FactorASTNode(this.parameter.power);
          const rightPart = new FunctionASTNode('ln', this.parameter.base);
          ret.add('multiply', rightPart);
        }
        break;
      default:
    }
    return ret;
  }
  compute() {
    const ret = this.clone();
    ret.parameter = ret.parameter.compute();
    for (const element of this.parameter.symbols) {
      ret.symbols.add(element);
    }
    return ret.getSimplify();
  }
  clone() {
    const ret = new FunctionASTNode(this.functionName, this.parameter.clone());
    return ret;
  }
  toString() {
    let ret;
    if (this.parameter.type === 'term' || this.parameter.type === 'negative') {
      ret = `${this.functionName}${this.parameter.toString()}`;
    } else {
      ret = `${this.functionName}(${this.parameter.toString()})`;
    }
    return ret;
  }
  functionDerivativeProcess(functionAst) {
    let ret;
    switch (functionAst.functionName) {
      case 'sin':
        functionAst.functionName = 'cos';
        ret = functionAst;
        break;
      case 'exp':
        functionAst.functionName = 'exp';
        ret = functionAst;
        break;
      case 'cos':
        functionAst.functionName = 'sin';
        ret = new UnaryASTNode('negative', functionAst);
        break;
      case 'ln':
        ret = new FactorASTNode(new IntegerASTNode('1'));
        ret.add('divide', functionAst.parameter);
        break;
      default:
        functionAst.functionName = `${functionAst.functionName}'`;
        ret = functionAst;
    }
    return ret;
  }
  derivative(symbol) {
    const rightPart = this.functionDerivativeProcess(this.clone());
    const ret = new FactorASTNode(rightPart);
    ret.add('multiply', this.parameter.derivative(symbol));
    return ret;
  }
}


class Lexical {
  constructor(str) {
    this.symbols = new Set();
    this.tokens = [];
    if (str) {
      this.generateTokens(str);
    }
  }

  setSym(symbol) {
    this.symbols.add(symbol);
  }

  singleCharacterProcess(charactor) {
    switch (charactor) {
      case '+':
      case '-':
      case '*':
      case '/':
        this.tokens.push(new Token('sign', charactor));
        return LEX_STATE.VACANT;
      case '(':
      case ')':
        this.tokens.push(new Token('parentheses', charactor));
        return LEX_STATE.VACANT;
      case '\t':
      case '\n':
      case ' ':
        return LEX_STATE.VACANT;
      default:
        break;
    }
  }

  vacantProcess(charactor) {
    switch (charactor) {
      case '+':
      case '-':
      case '*':
      case '/':
      case '^':
      case '=':
        this.tokens.push(new Token('sign', charactor));
        return LEX_STATE.VACANT;
      case '(':
      case ')':
        this.tokens.push(new Token('parentheses', charactor));
        return LEX_STATE.VACANT;
      case '\t':
      case '\n':
      case ' ':
        return LEX_STATE.VACANT;
      default:
        break;
    }
    if (/^[_a-zA-Z|\/|\\]$/.test(charactor)) {
      this.tokens.push(new Token('function', charactor));
      return LEX_STATE.RECEIVED_FUNC;
    }
    if (/^[0-9]$/.test(charactor)) {
      this.tokens.push(new Token('integer', charactor));
      return LEX_STATE.RECEIVED_NUM;
    }
  }

  receiveFuncProcess(charactor) {
    if (/^[_0-9a-zA-Z|\\]$/.test(charactor)) {
      const latestToken = this.tokens.pop();
      latestToken.content += charactor;
      this.tokens.push(latestToken);
      return LEX_STATE.RECEIVED_FUNC;
    }
    return this.vacantProcess(charactor);
  }

  receiveIntegerProcess(charactor) {
    if (/^[0-9]$/.test(charactor)) {
      const latestToken = this.tokens.pop();
      latestToken.content += charactor;
      this.tokens.push(latestToken);
      return LEX_STATE.RECEIVED_NUM;
    }
    return this.vacantProcess(charactor);
  }

  generateTokens(str) {
    let currentState = LEX_STATE.VACANT;
    for (const charactor of str) {
      switch (currentState) {
        case LEX_STATE.VACANT:
          currentState = this.vacantProcess(charactor);
          break;
        case LEX_STATE.RECEIVED_FUNC:
          currentState = this.receiveFuncProcess(charactor);
          break;
        case LEX_STATE.RECEIVED_NUM:
          currentState = this.receiveIntegerProcess(charactor);
          break;
        default:
          break;
      }
    }
    for (const token of this.tokens) {
      if (token.type === 'function' && this.symbols.has(token.content)) {
        token.type = 'symbol';
      }
    }
    return this.tokens;
  }

  /*
    expr → + unary | - unary
    unary	→ term { + term | - term }
    term	→ factor { * factor | / factor }
    factor -> power ^ power
    power	→ ( expr ) | digit | fun()
  */

  findPower(tokenIndex) {
    let currentIndex = tokenIndex;
    const firstToken = this.tokens[currentIndex];
    if (firstToken?.content === '(') {
      const result = this.findExpression(currentIndex + 1);
      currentIndex = result.index;
      if (this.tokens[currentIndex]?.content !== ')') {
        throw Error('parentheses is not matched');
      }
      return new ParseResult(currentIndex + 1, 'expression', result.ast);
    }
    if (firstToken.type === 'integer') {
      return new ParseResult(currentIndex + 1, firstToken.type, new IntegerASTNode(firstToken.content));
    }
    if (firstToken.type === 'symbol') {
      return new ParseResult(currentIndex + 1, firstToken.type, new SymbolASTNode(firstToken.content));
    }
    if (firstToken.type === 'function' && this.tokens[currentIndex + 1].content === '(') {
      const result = this.findExpression(currentIndex + 2);
      currentIndex = result.index;
      if (this.tokens[currentIndex]?.content !== ')') {
        throw Error('parentheses is not matched');
      }
      const ast = {};
      ast.functionName = firstToken.content;
      ast.parameter = result.ast;
      return new ParseResult(currentIndex + 1, firstToken.type, new FunctionASTNode(firstToken.content, result.ast));
    }
    if (firstToken?.content === '+') {
      const temp = this.findTerm(tokenIndex + 1);
      const ast = new UnaryASTNode('positive', temp.ast);
      currentIndex = temp.index;
      return new ParseResult(currentIndex, 'expression', ast);
    } else if (firstToken?.content === '-') {
      const temp = this.findTerm(tokenIndex + 1);
      const ast = new UnaryASTNode('negative', temp.ast);
      currentIndex = temp.index;
      return new ParseResult(currentIndex, 'expression', ast);
    }
  }

  findFactor(tokenIndex) {
    const result = this.findPower(tokenIndex);
    let currentIndex = result.index;
    const ast = new ExponentASTNode(result.ast);
    if (this.tokens[currentIndex]?.content === '^') {
      const temp = this.findPower(currentIndex + 1);
      ast.add(temp.ast);
      currentIndex = temp.index;
    }
    return new ParseResult(currentIndex, 'term', ast.getSimplify());
  }

  findTerm(tokenIndex) {
    const result = this.findFactor(tokenIndex);
    let currentIndex = result.index;
    const ast = new FactorASTNode(result.ast);
    while (true) {
      if (this.tokens[currentIndex]?.content === '*') {
        const temp = this.findFactor(currentIndex + 1);
        ast.add('multiply', temp.ast);
        currentIndex = temp.index;
      } else if (this.tokens[currentIndex]?.content === '/') {
        const temp = this.findFactor(currentIndex + 1);
        ast.add('divide', temp.ast);
        currentIndex = temp.index;
      } else if (this.tokens[currentIndex]?.content === '(') {
        const temp = this.findFactor(currentIndex);
        ast.add('multiply', temp.ast);
        currentIndex = temp.index;
      } else if (this.tokens[currentIndex]?.type === 'function' || this.tokens[currentIndex]?.type === 'symbol') {
        const temp = this.findFactor(currentIndex);
        ast.add('multiply', temp.ast);
        currentIndex = temp.index;
      } else {
        break;
      }
    }
    return new ParseResult(currentIndex, 'term', ast.getSimplify());
  }

  findExpression(tokenIndex) {
    const result = this.findTerm(tokenIndex);
    let currentIndex = result.index;
    const ast = new TermASTNode(result.ast);
    while (true) {
      if (this.tokens[currentIndex]?.content === '+') {
        const temp = this.findTerm(currentIndex + 1);
        ast.add('add', temp.ast);
        currentIndex = temp.index;
      } else if (this.tokens[currentIndex]?.content === '-') {
        const temp = this.findTerm(currentIndex + 1);
        ast.add('minus', temp.ast);
        currentIndex = temp.index;
      } else {
        break;
      }
    }
    return new ParseResult(currentIndex, 'unaryExpression', ast.getSimplify());
  }

  findUnaryExpression(tokenIndex) {
    const firstToken = this.tokens[tokenIndex];
    let currentIndex = tokenIndex;
    let ast;
    if (firstToken?.content === '+') {
      const temp = this.findUnaryExpression(tokenIndex + 1);
      ast = new UnaryASTNode('positive', temp.ast);
      currentIndex = temp.index;
    } else if (firstToken?.content === '-') {
      const temp = this.findUnaryExpression(tokenIndex + 1);
      ast = new UnaryASTNode('negative', temp.ast);
      currentIndex = temp.index;
    } else {
      const temp = this.findUnaryExpression(tokenIndex);
      ast = temp.ast;
      currentIndex = temp.index;
    }
    return new ParseResult(currentIndex, 'expression', ast);
  }

  parse() {
    const tokenIndex = 0;
    const result = this.findExpression(tokenIndex);
    return result;
  }
}

const b = new Lexical();
b.setSym('x');
b.setSym('y');
b.generateTokens('x^(-x)');
// b.generateTokens('ln(x^3)');
const ast2 = b.parse().ast;
const result = ast2.compute();
// console.info(result.derivative('x').toString());
// console.info(result.derivative('x').compute().toString());
const u = result.derivative('x').compute().toString();
console.info(u);
