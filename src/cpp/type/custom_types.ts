
import { TemplateType, Type } from './type.js';

export class UnionType extends TemplateType {
    constructor(public types: Array<Type>) {
        super('Union', types);
    }
}

export class UndefinedType extends Type {
    toString(): string {
        return "Undefined";
    }
}
