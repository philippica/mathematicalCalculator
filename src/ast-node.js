export class ASTNode {
    constructor(type, childNode, value) {
      this.symbols = new Set();
      this.child = childNode;
      this.value = value;
      this.type = type;
    }
}