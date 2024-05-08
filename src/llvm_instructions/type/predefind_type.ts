import { LlvmType } from "./type.js";

class PredefinedLlvmType extends LlvmType {
    constructor(private readonly _name: string) {
        super();
    }

    get name(): string {
        return `%${this._name}`;
    }
}

export function getVectorType(): LlvmType {
    return new PredefinedLlvmType('vector');
}
