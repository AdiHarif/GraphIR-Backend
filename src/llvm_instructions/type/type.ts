

import * as ins from '../instruction.js';

export abstract class LlvmType {
    abstract get name(): string;
}

export abstract class LlvmNumericType extends LlvmType {
    abstract getComparisonInstructionString(): string;
    abstract getComparisonConditionString(condition: ins.LlvmCondition): string;
    abstract getBinaryOperationInstructionString(operation: ins.LlvmNumericOperation): string;
    abstract getLiteralAsString(value: number): string;
}

export class LlvmIntegerType extends LlvmNumericType {
    constructor(public readonly width: number) {
        super();
    }

    get name(): string {
        return `i${this.width}`;
    }

    getComparisonInstructionString(): string {
        return `icmp`;
    }

    getComparisonConditionString(condition: ins.LlvmCondition): string {
        switch (condition) {
            case ins.LlvmCondition.Eq: return `eq`;
            case ins.LlvmCondition.Ne: return `ne`;
            case ins.LlvmCondition.Lt: return `slt`;
        }
    }

    getBinaryOperationInstructionString(operation: ins.LlvmNumericOperation): string {
        switch (operation) {
            case ins.LlvmNumericOperation.Add: return `add`;
            case ins.LlvmNumericOperation.Sub: return `sub`;
            case ins.LlvmNumericOperation.Mul: return `mul`;
            case ins.LlvmNumericOperation.Div: return `sdiv`;
            case ins.LlvmNumericOperation.LShift: return `shl`;
            case ins.LlvmNumericOperation.LRShift: return `lshr`;
            case ins.LlvmNumericOperation.ARShift: return `ashr`;
        }
    }

    getLiteralAsString(value: number): string {
        if (this.width === 1) {
            return value ? "1" : "0";
        }
        return `${Math.floor(value)}`;
    }
}

export class LlvmFloatType extends LlvmNumericType {
    constructor(public readonly width: 32 | 64) {
        super();
    }

    get name(): string {
        return this.width === 32 ? `float` : `double`;
    }

    getComparisonInstructionString(): string {
        return `fcmp`;
    }

    getComparisonConditionString(condition: ins.LlvmCondition): string {
        switch (condition) {
            case ins.LlvmCondition.Eq: return `oeq`;
            case ins.LlvmCondition.Ne: return `one`;
            case ins.LlvmCondition.Lt: return `olt`;
        }
    }

    getBinaryOperationInstructionString(operation: ins.LlvmNumericOperation): string {
        switch (operation) {
            case ins.LlvmNumericOperation.Add: return `fadd`;
            case ins.LlvmNumericOperation.Sub: return `fsub`;
            case ins.LlvmNumericOperation.Mul: return `fmul`;
            case ins.LlvmNumericOperation.Div: return `fdiv`;
            default: throw new Error(`Unsupported operation for float type: ${operation}`);
        }
    }

    getLiteralAsString(value: number): string {
        let out = `${value}`;
        if (Number.isInteger(value)) {
            out += ".0";
        }
        return out;
    }
}

export class LlvmVoidType extends LlvmType {
    get name(): string {
        return 'void';
    }
}

export class LlvmPointerType extends LlvmType {
    get name(): string {
        return 'ptr';
    }
}

export class LlvmArrayType extends LlvmType {
    constructor(public readonly elementType: LlvmType, public readonly size: number) {
        super();
    }

    get name(): string {
        return `[${this.size} x ${this.elementType.name}]`;
    }
}

export class LlvmStructType extends LlvmType {
    constructor(public readonly fields: Array<LlvmType>) {
        super();
    }

    get name(): string {
        return `{${this.fields.map(f => f.name).join(', ')}}`;
    }
}

export class LlvmFunctionType extends LlvmType {
    constructor(public readonly result: LlvmType, public readonly parameters: Array<LlvmType>) {
        super();
    }

    get name(): string {
        return `${this.result.name} (${this.parameters.map(p => p.name).join(', ')})`;
    }
};

