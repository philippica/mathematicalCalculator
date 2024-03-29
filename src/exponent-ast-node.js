import { ASTNode } from "./ast-node";
import { IntegerASTNode } from "./integer-ast-node";
import { BigInteger } from "./big-integer";
import { FactorASTNode } from "./factor-ast-node";
import { TermASTNode } from "./term-ast-node";
import { FunctionASTNode } from "./function-ast-node";

export class ExponentASTNode extends ASTNode {
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
    const temp = this.quickPower(base, power.divide(2).quotient);
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
      return new IntegerASTNode(result.toString()).compute();
    }
    if(base.type === 'factor') {
      const result = new FactorASTNode();
      for (const element of base.child) {
        const pow = new ExponentASTNode(element.value, power);
        result.add(element.type, pow);
      }
      return result.compute();
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
      result.add('multiply', this.base.clone().derivative('x').compute());
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