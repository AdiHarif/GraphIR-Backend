
import { Type } from "../type/type.js";
import { Expr } from "./expr.js";
import { BlockStmt } from "./stmt.js";

abstract class Decl {
    abstract toString(): string;
}

class VarDecl extends Decl {
    constructor(public type: Type, public name: string, public initializer?: Expr) {
        super();
    }

    toString(): string {
        let out = `${this.type.toString()} ${this.name}`;
        if (this.initializer) {
            out += ` = ${this.initializer.toString()}`;
        }
        out += ";";
        return out;
    }
}

class ParamDecl extends Decl {
    constructor(public type: Type, public name: string) {
        super();
    }

    toString(): string {
        return `${this.type.toString()} ${this.name}`;
    }
}

class FuncDecl extends Decl {
    constructor(public returnType: Type, public name: string, public parameters: Array<ParamDecl>, public body: BlockStmt) {
        super();
    }

    toString(): string {
        let out = `${this.returnType.toString()} ${this.name}(`;
        out += this.parameters.map(p => p.toString()).join(", ");
        out += ") ";
        out += this.body.toString();
        return out;
    }
}

class LabelDecl extends Decl {
    constructor(public name: string) {
        super();
    }

    toString(): string {
        return `${this.name}:`;
    }
}

export { Decl, VarDecl, ParamDecl, FuncDecl, LabelDecl };