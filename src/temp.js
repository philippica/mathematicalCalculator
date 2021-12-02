
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
    const numStr = this.trimLeadingZero(_numStr).split('.');
    this.rawDec = [];
    let numIndex = numStr[0].length - 1;
    let rawDecIndex = 0;
    while (numIndex >= 0) {
      this.rawDec.push(0);
      rawDecIndex = this.rawDec.length - 1;

      for (let i = BigInteger.compressDegree - 1; i >= 0; i--) {
        this.rawDec[rawDecIndex] = this.rawDec[rawDecIndex] * BigInteger._base + parseInt(numStr[0][numIndex - i] ?? 0, BigInteger._base);
      }

      numIndex -= BigInteger.compressDegree;
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
    return numStr.replace(/^0+/, '');
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
      const segmentResult = (op(segmentSelf, segmentAnother, carry) + BigInteger.realBase) % BigInteger.realBase;
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

    const isSwap = !this.largerThan(_num);
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
    const result = [];
    for (let i = 0; i < num.rawDec.length; i++) {
      for (let j = 0; j < this.rawDec.length; j++) {
        if (result[i + j] === undefined) {
          result.push(0);
        }
        const tempResult = result[i + j] + num.rawDec[i] * this.rawDec[j];
        result[i + j] = tempResult % BigInteger.realBase;
        const carry = parseInt(tempResult / BigInteger.realBase, 10);
        if (carry) {
          if (result[i + j + 1] === undefined) {
            result.push(0);
          }
          result[i + j + 1] += carry;
        }
      }
    }
    const ret = new BigInteger(result);
    ret.positive = !(this.positive ^ num.positive);
    return ret;
  }
  divide(_num) {
    let num = _num;
    if (typeof (_num) === 'number' || typeof (_num) === 'string') {
      num = new BigInteger(_num);
    }
    const start = this.rawDec.length - num.rawDec.length;
    if (start < 0) {
      return new BigInteger(0);
    }
    let a = new BigInteger(this.rawDec.slice(start));
    let ans = '';
    for (let i = start; i >= 0; i--) {
      let ansDigit = 0;
      while (true) {
        const b = a.minus(_num);
        if (!b.positive && !b.isZero()) {
          break;
        }
        ansDigit++;
        a = b;
      }
      let ansDigitStr = ansDigit.toString();
      while (ansDigitStr.length < BigInteger.compressDegree) {
        ansDigitStr = `0${ansDigitStr}`;
      }
      ans += ansDigitStr;
      a.rawDec.unshift(0);
      if (i > 0) {
        a.rawDec[0] = this.rawDec[i - 1];
      }
      while (a.rawDec[a.rawDec.length - 1] === 0 && a.rawDec.length > 1) {
        a.rawDec.pop();
      }
      a.positive = true;
    }
    const retBigInteger = new BigInteger(ans);
    retBigInteger.positive = !(this.positive ^ num.positive);
    return retBigInteger;
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
    return true;
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
    this.symbols = new Map();
    this.child = childNode;
    this.value = value;
    this.type = type;
  }
}


class IntegerASTNode extends ASTNode {
  constructor(value) {
    super('integer', null);
    this.obj = value;
  }
  compute() {
    this.value = new BigInteger(this.obj.content);
    return {
      computable: true,
      value: this.value,
    };
  }
  toString() {
    return this.obj.content;
  }
  clone() {
    return new IntegerASTNode(this.obj);
  }
  derivative() {
    const result = new IntegerASTNode('0');
    return result;
  }
}


class FunctionASTNode extends ASTNode {
  constructor(functionName, parameter) {
    super('function');
    this.parameter = parameter;
    this.functionName = functionName;
  }
  compute() {
    const parameter = this.parameter.compute();
    if (parameter.computable) {
      const paraStr = parameter.value.toString();
      return {
        computable: false,
        value: `${this.functionName}(${paraStr})`,
      };
    }
    return {
      computable: false,
      value: `${this.functionName}(${parameter.value})`,
    };
  }
}

class SymbolASTNode extends ASTNode {
  constructor(symbolName) {
    super('symbol');
    this.symbolName = symbolName;
  }
  compute() {
    return {
      computable: false,
      value: this.symbolName,
    };
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
    return this;
  }
  quickPower(base, power) {
    if (power.isZero()) {
      return new BigInteger(1);
    }
    if (power.rawDec[0] & 1) {
      return base.multiply(this.quickPower(base, power.minus(1)));
    }
    const temp = this.quickPower(base, power.divide(2));
    return temp.multiply(temp);
  }
  compute() {
    const base = this.base.compute();
    const power = this.power.compute();
    if (base.computable && power.computable) {
      let result = new BigInteger(1);
      if (power.value.positive) {
        result = this.quickPower(base.value, power.value);
      }
      return {
        computable: true,
        value: result,
      };
    }
    return {
      computable: false,
      value: `${base.value} ^ ${power.value}`,
    };
  }

  toString() {
    const base = this.base.toString();
    const power = this.power.toString();
    return `${base} ^ ${power}`;
  }
  clone() {
    return new IntegerASTNode(this.obj);
  }
}

class UnaryASTNode extends ASTNode {
  constructor(type, child) {
    super(type, child, null);
  }
  compute() {
    const temp = this.child.compute();
    if (!temp.computable) {
      if (this.type === 'positive') {
        this.value = `+${temp.value}`;
      } else if (this.type === 'negative') {
        this.value = `(-${temp.value})`;
      }
      return {
        computable: false,
        value: this.value,
      };
    }
    if (this.type === 'positive') {
      this.value = temp.value;
    } else if (this.type === 'negative') {
      this.value = temp.value.inverse();
    }
    return {
      computable: true,
      value: this.value,
    };
  }
  toString() {
    const temp = this.child.toString();
    if (this.type === 'positive') {
      return `+${temp}`;
    } else if (this.type === 'negative') {
      return `(-${temp})`;
    }
  }
  clone() {
    return new UnaryASTNode(this.type, this.child.clone());
  }
  derivative(symbol) {
    return new UnaryASTNode(this.type, this.child.derivative(symbol));
  }
}

class FactorASTNode extends ASTNode {
  constructor(value) {
    super('factor', [{ type: 'multiply', value }]);
  }
  add(type, value) {
    this.child.push({ type, value });
  }
  getSimplify() {
    this.child = this.child?.filter((child) => {
      if (child.value.type === 'integer') {
        return child.value?.obj?.content !== '1';
      }
      return true;
    });
    if (this.child.length === 1) {
      return this.child[0].value;
    }
    return this;
  }
  compute() {
    const computedList = this.child.map((x) => {
      const temp = x.value.compute();
      temp.type = x.type;
      return temp;
    });
    const computableList = computedList.filter(x => x.computable);
    const computableResult = computableList.length > 0 ? computableList.reduce((x, y) => {
      if (y.type === 'multiply') {
        return { computable: true, value: x.value.multiply(y.value), type: 'multiply' };
      }
      return { computable: true, value: x.value.divide(y.value), type: 'divide' };
    }, { type: 'multiply', value: new BigInteger(1), computable: true }).value : new BigInteger(1);

    const incomputableList = computedList.filter(x => !x.computable);
    const incomputableResult = incomputableList.length > 0 ? incomputableList.reduce((x, y) => {
      if (y.type === 'multiply') {
        return { computable: false, value: `${x.value} * ${y.value}`, type: 'multiply' };
      }
      return { computable: false, value: `${x.value} / ${y.value}`, type: 'divide' };
    }).value : '';

    if (incomputableResult !== '') {
      if (computableResult.isEqual(1)) {
        return {
          computable: false,
          value: incomputableResult,
        };
      } else if (incomputableList[0].type === 'multiply') {
        return {
          computable: false,
          value: `${computableResult.toString()} * ${incomputableResult}`,
        };
      }
      return {
        computable: false,
        value: `${computableResult.toString()} / ${incomputableResult}`,
      };
    }
    return {
      computable: true,
      value: computableResult,
    };
  }
  derivative(symbol) {
    const computedList = this.child.map((x) => {
      const temp = x.value.derivative(symbol);
      temp.type = x.type;
      return temp;
    });
  }
  clone() {
    const ret = new FactorASTNode(this.child[0].value.clone());
    for (let i = 1; i < this.child.length; i++) {
      ret.add(this.child[i].type, this.child[i].value.clone());
    }
    return ret;
  }

  toString() {
    let result = this.child[0].value.toString();
    for (let i = 1; i < this.child.length; i++) {
      const another = this.child[i].value.toString();
      switch (this.child[i].type) {
        case 'multiply':
          result += ` * ${another}`;
          break;
        case 'divide':
          result += ` / ${another}`;
          break;
        default:
          break;
      }
    }
    return result;
  }
}

class TermASTNode extends ASTNode {
  constructor(value) {
    super('term', [{ type: 'add', value }]);
  }
  add(type, value) {
    this.child.push({ type, value });
  }
  getSimplify() {
    this.child = this.child?.filter((child) => {
      if (child.value?.isEqual) {
        return child.value?.isEqual(0);
      }
      return true;
    });
    if (this.child.length === 1) {
      return this.child[0].value;
    }
    return this;
  }
  compute() {
    const computedList = this.child.map((x) => {
      const temp = x.value.compute();
      temp.type = x.type;
      return temp;
    });
    const computableList = computedList.filter(x => x.computable);
    const computableResult = computableList.length > 0 ? computableList.reduce((x, y) => {
      if (y.type === 'add') {
        return { computable: true, value: x.value.add(y.value), type: 'add' };
      }
      return { computable: true, value: x.value.minus(y.value), type: 'minus' };
    }, { type: 'add', value: new BigInteger(0), computable: true }).value : new BigInteger(0);

    const incomputableList = computedList.filter(x => !x.computable);
    let incomputableResult = incomputableList.length > 0 ? incomputableList.reduce((x, y) => {
      if (y.type === 'add') {
        return { computable: false, value: `${x.value} + ${y.value}`, type: 'add' };
      }
      return { computable: false, value: `${x.value} - ${y.value}`, type: 'minus' };
    }).value : '';

    if (incomputableList && incomputableList[0]?.type === 'minus') {
      incomputableResult = `-${incomputableResult}`;
    }

    if (incomputableResult !== '') {
      if (computableResult.isZero()) {
        return {
          computable: false,
          value: `(${incomputableResult})`,
        };
      }
      return {
        computable: false,
        value: `(${computableResult.toString()} + (${incomputableResult}))`,
      };
    }
    return {
      computable: true,
      value: computableResult,
    };
  }
  toString() {
    let result = this.child[0].value.toString();
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
    return `(${result})`;
  }
  clone() {
    const ret = new TermASTNode(this.child[0].value.clone());
    for (let i = 1; i < this.child.length; i++) {
      ret.add(this.child[i].type, this.child[i].value.clone());
    }
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
        throw Error('parentheses is not match');
      }
      return new ParseResult(currentIndex + 1, 'expression', result.ast);
    }
    if (firstToken.type === 'integer') {
      return new ParseResult(currentIndex + 1, firstToken.type, new IntegerASTNode(firstToken));
    }
    if (firstToken.type === 'symbol') {
      return new ParseResult(currentIndex + 1, firstToken.type, new SymbolASTNode(firstToken.content));
    }
    if (firstToken.type === 'function' && this.tokens[currentIndex + 1].content === '(') {
      const result = this.findExpression(currentIndex + 2);
      currentIndex = result.index;
      if (this.tokens[currentIndex]?.content !== ')') {
        throw Error('parentheses is not match');
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
b.generateTokens('95123^12');
const ast2 = b.parse().ast;
const result = ast2.compute();
if (result.computable)console.info(result.value.toString());
else console.info(result.value);
