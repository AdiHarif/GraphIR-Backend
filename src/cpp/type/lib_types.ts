
import { Type } from "./type.js";

class VectorType extends Type {
    constructor(public elementType: Type) {
        super();
    }

    toString(): string {
        return `std::vector<${this.elementType.toString()}>`;
    }
}

class SharedPointerType extends Type {
    constructor(public elementType: Type) {
        super();
    }

    toString(): string {
        return `std::shared_ptr<${this.elementType.toString()}>`;
    }
}

export { VectorType, SharedPointerType };
