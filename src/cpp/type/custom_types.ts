
import { Type } from './type.js';

export class UnionType extends Type {
    toString(): string {
        return "Union";
    }
}

export class UndefinedType extends Type {
    toString(): string {
        return "Undefined";
    }
}
