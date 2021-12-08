import { IntegerASTNode } from './integer-ast-node';
import { TermASTNode } from './term-ast-node';
import { FactorASTNode } from './factor-ast-node';
import { ExponentASTNode } from './exponent-ast-node';
import { FunctionASTNode } from './function-ast-node';
import { SymbolASTNode } from './symbol-ast-node';


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


export class Lexical {
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
      return new ParseResult(currentIndex + 1, firstToken.type, new IntegerASTNode(firstToken.content));
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

