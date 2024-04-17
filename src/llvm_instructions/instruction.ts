
import {InstructionVisitor} from './instruction_visitor.js'
import { LlvmType, LlvmPrimitiveType, LlvmFunctionType } from './type.js'


export type Register = string;
export type Parameter = string;
export type Label = string;
export type NamedValue = Register | Parameter | Label;
export type Value = Register | Parameter | number;

export enum LlvmNumericOperation {
    Add = 'fadd',
    Sub = 'fsub',
    Mul = 'fmul',
    Div = 'fdiv',
    LShift = 'shl',
    LRShift = 'lshr',
    ARShift = 'ashr',
}

export enum LlvmCondition {
    Eq = 'oeq',
    Ne = 'one',
    Lt = 'olt',
}

export enum LlvmCastOperation {
    FpToSi = 'fptosi',
    SiToFp = 'sitofp',
}

export type TypedValue = {
	value: Value;
	type: LlvmType | null;
}

export interface Instruction {
    accept<T>(visitor: InstructionVisitor<T>): T;
}

export class BinaryOperationInstruction implements Instruction {
    constructor(
        public readonly result: Register,
        public readonly resultType: LlvmType,
        public readonly operation: LlvmNumericOperation,
        public readonly left: Value,
        public readonly right: Value
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitBinaryOperationInstruction(this);
    }
}

export class LabelInstruction implements Instruction {
    constructor(
        public readonly label: Label
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitLabelInstruction(this);
    }
}

export class VoidCallInstruction implements Instruction {
    static readonly type = LlvmPrimitiveType.Void;

    constructor(
        public name: string,
        public args: Array<TypedValue>
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitVoidCallInstruction(this);
    }
}

export class CallInstruction implements Instruction {
    constructor(
        public result: Register,
        public resultType: LlvmType,
        public name: string,
        public args: Array<TypedValue>
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitCallInstruction(this);
    }
}

export class ReturnInstruction implements Instruction {
    constructor(
        public readonly type: LlvmType,
        public readonly value: Value
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitReturnInstruction(this);
    }
}

export class JumpInstruction implements Instruction {
    constructor(
        public readonly label: Label
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitJumpInstruction(this);
    }
}

export class BranchInstruction implements Instruction {
    constructor(
        public readonly condition: Value,
        public readonly trueLabel: Label,
        public readonly falseLabel: Label
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitBranchInstruction(this);
    }
}

export class PhiInstruction implements Instruction {
    constructor(
        public readonly result: Register,
        public readonly resultType: LlvmType,
        public readonly operands: Array<[Value, Label]>
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitPhiInstruction(this);
    }
}

export class ComparisonInstruction implements Instruction {
    constructor(
        public readonly result: Register,
        public readonly condition: LlvmCondition,
        public readonly left: Value,
        public readonly right: Value
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitComparisonInstruction(this);
    }
}

export class CastInstruction implements Instruction {
    constructor(
        public readonly result: Register,
        public readonly operation: LlvmCastOperation,
        public readonly srcType: LlvmType,
        public readonly value: Value,
        public readonly dstType: LlvmType
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitCastInstruction(this);
    }
}

export class Function implements Instruction {
    public readonly instructions: Array<Instruction> = [];
    constructor(
        public readonly name: string,
        public readonly functionType: LlvmFunctionType
    ) {}

    accept<T>(visitor: InstructionVisitor<T>): T {
        return visitor.visitFunction(this);
    }
}