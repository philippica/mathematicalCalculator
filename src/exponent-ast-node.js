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
      const temp = this.quickPower(base, power.divide(2));
      return temp.multiply(temp);
    }
    compute() {
      const base = this.base.compute();
      const power = this.power.compute();
      if (base.type === 'integer' && power.type === 'integer') {
        let result = new BigInteger(1);
        if (power.value.positive) {
          result = this.quickPower(base.value, power.value);
        }
        return new IntegerASTNode(result.toString());
      }
      const ret = new ExponentASTNode(base, power).getSimplify();
      for (const element of base.symbols) {
        ret.symbols.add(element);
      }
      for (const element of power.symbols) {
        ret.symbols.add(element);
      }
      return ret;
    }
  
    toString() {
      if (this.strRaw) {
        return this.strRaw;
      }
      let base = this.base.toString();
      let power = this.power.toString();
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
      return result;
    }
  }