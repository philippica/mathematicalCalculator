import { ASTNode } from "./ast-node";
import { UnaryASTNode } from "./unary-ast-node";
import { FactorASTNode } from "./factor-ast-node";
import { IntegerASTNode } from "./integer-ast-node";

export class FunctionASTNode extends ASTNode {
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
    if (this.parameter.type === 'negative') {
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
    return ret.compute();
  }
}
