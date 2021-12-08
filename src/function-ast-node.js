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
    compute() {
      const ret = this.clone();
      ret.parameter = ret.parameter.compute();
      return ret;
    }
    clone() {
      const ret = new FunctionASTNode(this.functionName, this.parameter.clone());
      return ret;
    }
    toString() {
      let ret;
      if (this.parameter.type === 'term') {
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
  