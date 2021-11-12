/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-tabs */
/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-vars */


/* eslint-disable consistent-return */
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
    this.child = childNode;
    this.value = value;
    this.type = type;
  }
}

class FunctionASTNode extends ASTNode {
  constructor(functionName, parameter) {
    super('function');
    this.parameter = parameter;
    this.functionName = functionName;
  }
}

class IntegerASTNode extends ASTNode {
  constructor(value) {
    super('integer', null);
    this.obj = value;
  }
  compute() {
    this.value = parseInt(this.obj.content, 10);
    return this.value;
  }
}

class UnaryASTNode extends ASTNode {
  constructor(type, child, value) {
    super(type, child, null);
  }
  compute() {
    const temp = this.child.compute();
    if (this.type === 'positive') {
      this.value = temp;
    } else if (this.type === 'negative') {
      this.value = -temp;
    }
    return this.value;
  }
}

class ListASTNode extends ASTNode {
  constructor(value) {
    super('factor', [{ type: 'first', value }]);
  }
  add(type, value) {
    this.child.push({ type, value });
  }
  getSimplify() {
    if (this.child.length === 1) {
      return this.child[0].value;
    }
    return this;
  }
  compute() {
    this.value = this.child[0].value.compute();
    for (let i = 1; i < this.child.length; i++) {
      switch (this.child[i].type) {
        case 'add':
          this.value += this.child[i].value.compute();
          break;
        case 'minus':
          this.value -= this.child[i].value.compute();
          break;
        case 'multiply':
          this.value *= this.child[i].value.compute();
          break;
        case 'divide':
          this.value /= this.child[i].value.compute();
          break;
        default:
          break;
      }
    }
    return this.value;
  }
}


class Lexical {
  constructor(str) {
    this.tokens = [];
    if (str) {
      this.generateTokens(str);
    }
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
    if (/^[_0-9a-zA-Z|\/|\\]$/.test(charactor)) {
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
    return this.tokens;
  }

  /*
    expr → + unary | - unary
    unary	→ term { + term | - term }
    term	→ factor { * factor | / factor }
    factor	→ ( expr ) | digit | fun()
  */

  findFactor(tokenIndex) {
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
  }

  findTerm(tokenIndex) {
    const result = this.findFactor(tokenIndex);
    let currentIndex = result.index;
    const ast = new ListASTNode(result.ast);
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

  findUnaryExpression(tokenIndex) {
    const result = this.findTerm(tokenIndex);
    let currentIndex = result.index;
    const ast = new ListASTNode(result.ast);
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

  findExpression(tokenIndex) {
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

