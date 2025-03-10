
import { TemplateType, Type } from './type.js';

export class UnionType extends TemplateType {
    constructor(public types: Array<Type>) {
        super('Union', types);
    }
}

export class UserDefinedType extends Type {
    constructor(public name: string) {
        super();
    }

    toString(): string {
        return this.name;
    }
}

export class UndefinedType extends Type {
    toString(): string {
        return "Undefined";
    }
}

export class DynamicArrayType extends TemplateType {
    constructor(public elementType: Type) {
        super('DynamicArray', [elementType]);
    }
}
