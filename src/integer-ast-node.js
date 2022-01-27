import { ASTNode } from './ast-node';
import { BigInteger } from './big-integer';

export class IntegerASTNode extends ASTNode {
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
    return result.compute();
  }
}