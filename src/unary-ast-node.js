import { ASTNode } from "./ast-node";


export class UnaryASTNode extends ASTNode {
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
        if(this.type === 'negative') {
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
    toString() {
      if (this.strRaw) {
        return this.strRaw;
      }
      const temp = this.child.toString();
      if (this.type === 'positive') {
        this.strRaw = `+${temp}`;
      } else if (this.type === 'negative') {
        this.strRaw = `(-${temp})`;
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