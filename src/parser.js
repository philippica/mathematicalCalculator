import { BigInteger } from "./big-integer";


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

export class Parser {
  constructor(str) {
    this.tokens = [];
    if(str) {
      this.getToken(str);
    }
  }

  vacantProcess(charactor) {
    switch(charactor) {
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
    if(/^[-_a-zA-Z|\/|\\]$/.test(charactor)) {
      this.tokens.push(new Token('function', charactor));
      return LEX_STATE.RECEIVED_FUNC;
    }
    if(/^[0-9]$/.test(charactor)) {
      this.tokens.push(new Token('integer', charactor));
      return LEX_STATE.RECEIVED_NUM;
    }
  }

  receiveFuncProcess(charactor) {

  }

  getToken(str) {
    let currentState = LEX_STATE.VACANT;
    for(let charactor of str) {
      switch(currentState) {
        case LEX_STATE.VACANT:
          currentState = this.vacantProcess(charactor);
          break;
        case LEX_STATE.RECEIVED_FUNC:
          currentState = this.receiveFuncProcess(charactor);
          break;
        case LEX_STATE.RECEIVED_NUM:
          break;
        default:
          break;
      }
    }
  }
}