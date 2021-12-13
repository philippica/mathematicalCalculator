import { ASTNode } from "./ast-node";
import { FactorASTNode } from "./factor-ast-node";
import { IntegerASTNode } from "./integer-ast-node";
import { UnaryASTNode } from "./unary-ast-node";

export class TermASTNode extends ASTNode {
    constructor(value) {
      super('term', []);
      if (value) {
        this.add('add', value);
      }
    }
    add(type, value) {
      this.child.push({ type, value });
    }
  
    combine() {
      const childStrMap = new Map();
      this.child.forEach((term) => {
        const str = term.value.toString();
        const count = childStrMap.get(str);
        if (count) {
          childStrMap.set(str, count + 1);
          if (term.type === 'add') {
            childStrMap.set(str, count + 1);
          } else {
            childStrMap.set(str, count - 1);
          }
        } else {
          if (term.type === 'add') {
            childStrMap.set(str, 1);
          } else {
            childStrMap.set(str, -1);
          }
        }
      });
      const newChild = [];
      this.child.forEach((term) => {
        const str = term.value.toString();
        const count = childStrMap.get(str);
        if (count === 0) {
          return;
        }
        if (count === 1) {
          term.type = 'add';
          newChild.push(term);
        } else if (count === -1) {
          term.type = 'minus';
          newChild.push(term);
        } else {
          const result = new FactorASTNode();
          result.add('multiply', new IntegerASTNode(count.toString()));
          result.add('multiply', term.value);
          term.value = result;
          term.type = 'add';
          newChild.push(term);
        }
        childStrMap.set(str, 0);
      });
      this.child = newChild;
    }
  
    getSimplify() {
      const addChild = this.child?.filter(child => child.value.type === 'term' && child.type === 'add');
      this.child = this.child?.filter(child => child.value.type !== 'term' || child.type !== 'add');
  
      addChild.forEach((term) => {
        term.value.child.forEach((child) => {
          this.child.push(child);
        });
      });
  
      this.child = this.child?.filter((child) => {
        if (child.value.type === 'integer') {
          return !child.value?.value?.isZero();
        }
        return true;
      });
  
      this.combine();
  
      if (this.child.length === 1) {
        if (this.child[0].type === 'add') {
          return this.child[0].value;
        }
        return new UnaryASTNode('negative', this.child[0].value);
      }
      if (this.child.length === 0) {
        return new IntegerASTNode('0').compute();
      }
  
      this.child.forEach((child) => {
        if (child.value.type === 'positive') {
          child.value = child.value.child;
        } else if (child.value.type === 'negative') {
          child.value = child.value.child;
          if (child.type === 'add') {
            child.type = 'minus';
          } else {
            child.type = 'add';
          }
        }
      });
      return this;
    }
    compute() {
      this.getSimplify();
      const ret = new TermASTNode();
      const addList = this.child.filter(x => x.type === 'add').map(x => x.value.compute());
      const minusList = this.child.filter(x => x.type === 'minus').map(x => x.value.compute());
  
      const incomputableMinusList = minusList.filter(x => x.type !== 'integer');
      const integerMinus = minusList.filter(x => x.type === 'integer').reduce((x, y) => {
        const result = x.value.add(y.compute().value);
        const _ret = new IntegerASTNode(result.toString());
        _ret.value = result;
        return _ret.compute();
      }, new IntegerASTNode('0').compute());
  
      integerMinus.value.positive = !integerMinus.value.positive;
  
      const incomputableAddList = addList.filter(x => x.type !== 'integer');
      const integerAdd = addList.filter(x => x.type === 'integer').reduce((x, y) => {
        const result = x.value.add(y.compute().value);
        const _ret = new IntegerASTNode(result.toString());
        _ret.value = result;
        return _ret.compute();
      }, integerMinus);
  
  
      if (integerAdd.value.positive === true) {
        ret.add('add', integerAdd);
      } else {
        integerAdd.value.positive = true;
        integerAdd.obj = integerAdd.value.toString();
        ret.add('minus', integerAdd);
      }
      incomputableAddList.forEach((x) => {
        for (const element of x.symbols) {
          ret.symbols.add(element);
        }
        ret.add('add', x);
      });
  
      incomputableMinusList.forEach((x) => {
        for (const element of x.symbols) {
          ret.symbols.add(element);
        }
        ret.add('minus', x);
      });
      return ret.getSimplify();
    }
  
    toString() {
      if (this.strRaw) {
        return this.strRaw;
      }
      let result = this.child[0].value.toString();
      if (this.child[0].type === 'minus') {
        result = `-${result}`;
      }
      for (let i = 1; i < this.child.length; i++) {
        const another = this.child[i].value.toString();
        switch (this.child[i].type) {
          case 'add':
            result += ` + ${another}`;
            break;
          case 'minus':
            result += ` - ${another}`;
            break;
          default:
            break;
        }
      }
      this.strRaw = `(${result})`;
      return this.strRaw;
    }
    clone() {
      const ret = new TermASTNode();
      for (let i = 0; i < this.child.length; i++) {
        ret.add(this.child[i].type, this.child[i].value.clone());
      }
      return ret;
    }
    derivative(symbol) {
      const ret = this.clone();
      ret.child = ret.child.map((x) => {
        x.value = x.value.derivative(symbol);
        return x;
      });
      return ret.getSimplify();
    }
  }