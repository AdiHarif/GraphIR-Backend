
import { Expr } from './expr.js';

abstract class Stmt {
    abstract toString(): string;
}

class BlockStmt extends Stmt {
    constructor(public statements: Array<Stmt>) {
        super();
    }

    toString(): string {
        return `{\n${this.statements.map(s => s.toString()).join("\n\t")}\n}`;
    }
}

class ExprStmt extends Stmt {
    constructor(public expr: Expr) {
        super();
    }

    toString(): string {
        return `${this.expr.toString()};`;
    }
}

class GotoStmt extends Stmt {
    constructor(public label: string) {
        super();
    }

    toString(): string {
        return `goto ${this.label};`;
    }
}

class ReturnStmt extends Stmt {
    constructor(public expr?: Expr) {
        super();
    }

    toString(): string {
        return this.expr ? `return ${this.expr.toString()};` : "return;";
    }
}

export { Stmt, BlockStmt, ExprStmt, GotoStmt, ReturnStmt };
