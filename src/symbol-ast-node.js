import { ASTNode } from "./ast-node";
import { IntegerASTNode } from "./integer-ast-node";

export class SymbolASTNode extends ASTNode {
    constructor(symbolName) {
      super('symbol');
      this.symbolName = symbolName;
      this.symbols.add(symbolName);
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
    getSimplify() {
        return this;
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