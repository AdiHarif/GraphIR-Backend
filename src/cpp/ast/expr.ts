
import { Type } from "../type/type.js";

abstract class Expr {
    abstract toString(): string;
}

class LiteralExpr extends Expr {
    constructor(public value: string | number | boolean) {
        super();
    }

    toString(): string {
        return this.value.toString();
    }
}

class IdentifierExpr extends Expr {
    constructor(public name: string) {
        super();
    }

    toString(): string {
        return this.name;
    }
}

class PrefixUnaryOperationExpr extends Expr {
    constructor(public op: string, public operand: Expr) {
        super();
    }

    toString(): string {
        return `(${this.op}${this.operand.toString()})`;
    }
}

class PostfixUnaryOperationExpr extends Expr {
    constructor(public op: string, public operand: Expr) {
        super();
    }

    toString(): string {
        return `(${this.operand.toString()}${this.op})`;
    }
}

class BinaryOperationExpr extends Expr {
    constructor(public op: string, public left: Expr, public right: Expr) {
        super();
    }

    toString(): string {
        return `(${this.left.toString()} ${this.op} ${this.right.toString()})`;
    }
}

class NewArrayExpr extends Expr {
    constructor(public elementType: Type, public size: Expr) {
        super();
    }

    toString(): string {
        return `new ${this.elementType.toString()}[${this.size.toString()}]`;
    }
}

class CallExpr extends Expr {
    constructor(public name: string, public args: Array<Expr>) {
        super();
    }

    toString(): string {
        return `${this.name}(${this.args.map(a => a.toString()).join(", ")})`;
    }
}

class TemplateCallExpr extends CallExpr {
    constructor(public name: string, public args: Array<Expr>, public templateArgs: Array<Type>) {
        super(name, args);
    }

    toString(): string {
        return `${this.name}<${this.templateArgs.map(a => a.toString()).join(", ")}>(${this.args.map(a => a.toString()).join(", ")})`;
    }
}

class StructLiteralExpr extends Expr {
    constructor(public fields: Array<Expr>) {
        super();
    }

    toString(): string {
        return `{${this.fields.map(f => f.toString()).join(", ")}}`;
    }
}

class CastingExpr extends Expr {
    constructor(public type: Type, public expr: Expr) {
        super();
    }

    toString(): string {
        return `(${this.type.toString()})${this.expr.toString()}`;
    }
}

class ParenthesizedExpr extends Expr {
    constructor(public expr: Expr) {
        super();
    }

    toString(): string {
        return `(${this.expr.toString()})`;
    }
}

class SubscriptExpr extends Expr {
    constructor(public object: Expr, public index: Expr) {
        super();
    }

    toString(): string {
        return `${this.object.toString()}[${this.index.toString()}]`;
    }
}

export { Expr, LiteralExpr, PrefixUnaryOperationExpr, PostfixUnaryOperationExpr, BinaryOperationExpr, NewArrayExpr, IdentifierExpr, CallExpr, TemplateCallExpr, StructLiteralExpr, CastingExpr, ParenthesizedExpr, SubscriptExpr };
