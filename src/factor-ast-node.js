import { ASTNode } from "./ast-node";
import { TermASTNode } from "./term-ast-node";
import { BigInteger } from "./big-integer";
import { IntegerASTNode } from "./integer-ast-node";
import { ExponentASTNode } from "./exponent-ast-node";
import { UnaryASTNode } from "./unary-ast-node";

export class FactorASTNode extends ASTNode {
    constructor(value) {
      super('factor', []);
      if (value) {
        this.add('multiply', value);
      }
    }
    add(type, value) {
      this.child.push({ type, value });
    }
  
    combine() {
      const childStrMap = new Map();
      this.child.forEach((factor) => {
        let str = factor.value.toString();
        let num = new BigInteger(1);
        if (factor.value.type === 'Exponent' && factor.value.power.type === 'integer') {
          str = factor.value.base.toString();
          num = factor.value.power.compute().value;
        }
        const count = childStrMap.get(str);
        if (count) {
          childStrMap.set(str, count.add(num));
          if (factor.type === 'multiply') {
            childStrMap.set(str, count.add(num));
          } else {
            childStrMap.set(str, count.minus(num));
          }
        } else {
          if (factor.type === 'multiply') {
            childStrMap.set(str, num);
          } else {
            childStrMap.set(str, num.inverse());
          }
        }
      });
      const newChild = [];
      this.child.forEach((factor) => {
        let str = factor.value.toString();
        let base = factor.value;
        if (factor.value.type === 'Exponent' && factor.value.power.type === 'integer') {
          str = factor.value.base.toString();
          base = factor.value.base;
        }
  
        const count = childStrMap.get(str);
        if (count.isZero()) {
          return;
        }
        if (count.isEqual(1)) {
          factor.type = 'multiply';
          newChild.push(factor);
        } else if (count.isEqual(-1)) {
          factor.type = 'divide';
          newChild.push(factor);
        } else {
          const result = new ExponentASTNode(base);
          result.add(new IntegerASTNode(count.toString()));
          factor.value = result;
          factor.type = 'multiply';
          newChild.push(factor);
        }
        childStrMap.set(str, new BigInteger(0));
      });
      this.child = newChild;
    }
  
    getSimplify() {
      const factorChild = this.child?.filter(child => child.value.type === 'factor' && child.type === 'multiply');
      this.child = this.child?.filter(child => child.value.type !== 'factor' || child.type !== 'multiply');
  
      factorChild.forEach((factor) => {
        factor.value.child.forEach((child) => {
          this.child.push(child);
        });
      });
      this.child = this.child?.filter((child) => {
        if (child.value.type === 'integer') {
          return child.value?.obj !== '1';
        }
        return true;
      });
      const zero = this.child?.filter((child) => {
        if (child.value.type === 'integer') {
          return child.value?.obj === '0';
        }
        return false;
      });
      if (zero.length > 0) {
        return new IntegerASTNode('0').compute();
      }
      if (this.child.length === 0) {
        return new IntegerASTNode('1').compute();
      }
  
      this.combine();
      if (this.child.length === 1 && this.child[0].type === 'multiply') {
        return this.child[0].value;
      }
      if (this.child.length === 0) {
        return new IntegerASTNode('1').compute();
      }
  
      let negativeCount = 0;
      this.child?.forEach((child) => {
        if (child.value.type === 'negative') {
          child.value = child.value.child;
          negativeCount++;
        } else if (child.value.type === 'positive') {
          child.value = child.value.child;
        }
      });
      if (negativeCount & 1) {
        return new UnaryASTNode('negative', this);
      }
  
      return this;
    }
    compute() {
      const ret = new FactorASTNode();
      const multiplyList = this.child.filter(x => x.type === 'multiply').map(x => x.value.compute());
      const divideList = this.child.filter(x => x.type === 'divide').map(x => x.value.compute());
  
      const incomputableMultiplyList = multiplyList.filter(x => x.type !== 'integer');
      const integerMultiplyList = multiplyList.filter(x => x.type === 'integer').reduce((x, y) => {
        const result = x.value.multiply(y.value);
        const _ret = new IntegerASTNode(result.toString());
        _ret.value = result;
        return _ret;
      }, new IntegerASTNode('1').compute());
  
      const incomputableDivideList = divideList.filter(x => x.type !== 'integer');
      const integerDivideList = divideList.filter(x => x.type === 'integer').reduce((x, y) => {
        const result = x.value.multiply(y.value);
        const _ret = new IntegerASTNode(result.toString());
        _ret.value = result;
        return _ret;
      }, new IntegerASTNode('1').compute());
  
      ret.add('multiply', integerMultiplyList);
      incomputableMultiplyList.forEach((x) => {
        for (const element of x.symbols) {
          ret.symbols.add(element);
        }
        ret.add('multiply', x);
      });
  
      ret.add('divide', integerDivideList);
      incomputableDivideList.forEach((x) => {
        for (const element of x.symbols) {
          ret.symbols.add(element);
        }
        ret.add('divide', x);
      });
      return ret.getSimplify();
    }
    derivative(symbol) {
      const ret = new TermASTNode();
      for (let i = 0; i < this.child.length; i++) {
        const term = this.clone();
        term.child[i].value = term.child[i].value.derivative(symbol);
        ret.add('add', term);
      }
      return ret.getSimplify();
    }
    clone() {
      const ret = new FactorASTNode();
      for (let i = 0; i < this.child.length; i++) {
        ret.add(this.child[i].type, this.child[i].value.clone());
      }
      return ret;
    }
  
    toString() {
      if (this.strRaw) {
        return this.strRaw;
      }
      let result = this.child[0].value.toString();
      let hasMultiply = this.child[0].type === 'multiply';
      for (let i = 1; i < this.child.length; i++) {
        const another = this.child[i].value.toString();
        switch (this.child[i].type) {
          case 'multiply':
            result += ` * ${another}`;
            hasMultiply = 1;
            break;
          case 'divide':
            result += ` / ${another}`;
            break;
          default:
            break;
        }
      }
      if (hasMultiply === 0) {
        result = `(1 / ${result})`;
      }
      this.strRaw = result;
      return this.strRaw;
    }
  }