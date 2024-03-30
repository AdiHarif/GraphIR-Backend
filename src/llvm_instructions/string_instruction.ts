
import * as ins from "./instruction.js";
import { InstructionVisitor } from "./instruction_visitor.js";

function valueToString(value: ins.Value, type: ins.LlvmType): string {
    if (typeof value === "string") {
        return value;
    }
    let out;
    switch (type) {
        case ins.LlvmType.I1:
            out = value ? "1" : "0";
            break;
        case ins.LlvmType.I64:
            out = `${Math.floor(value as number)}`;
            break;
        case ins.LlvmType.F64:
            out = `${value}`;
            if (Number.isInteger(value)) {
                out += ".0";
            }
            break;
        case ins.LlvmType.Void:
            out = "void";
            break;
        default:
            throw new Error(`Unknown type: ${type}`);
    }
    return out;
}

class InstructionStringVisitor implements InstructionVisitor<string> {
    visitBinaryOperationInstruction(instruction: ins.BinaryOperationInstruction): string {
        return `${instruction.result} = ${instruction.operation} ${instruction.resultType} ${valueToString(instruction.left, instruction.resultType)}, ${valueToString(instruction.right, instruction.resultType)}`;
    }

    visitLabelInstruction(instruction: ins.LabelInstruction): string {
        return `${instruction.label}:`;
    }

    visitVoidCallInstruction(instruction: ins.VoidCallInstruction): string {
        return `call void @${instruction.name}(${instruction.args.map(a => `${a.type} ${valueToString(a.value, a.type!)}`).join(", ")})`;
    }

    visitCallInstruction(instruction: ins.CallInstruction): string {
        return `${instruction.result} = call ${instruction.resultType} @${instruction.name}(${instruction.args.map(a => `${a.type} ${valueToString(a.value, a.type!)}`).join(", ")})`;
    }

    visitReturnInstruction(instruction: ins.ReturnInstruction): string {
        return `ret ${instruction.type} ${valueToString(instruction.value, instruction.type!)}`;
    }

    visitJumpInstruction(instruction: ins.JumpInstruction): string {
        return `br label %${instruction.label}`;
    }

    visitBranchInstruction(instruction: ins.BranchInstruction): string {
        return `br i1 ${instruction.condition}, label %${instruction.trueLabel}, label %${instruction.falseLabel}`;
    }

    visitPhiInstruction(instruction: ins.PhiInstruction): string {
        return `${instruction.result} = phi ${instruction.resultType} ${instruction.operands.map(v => `[${v[0]}, %${v[1]}]`).join(", ")}`;
    }

    visitComparisonInstruction(instruction: ins.ComparisonInstruction): string {
        return `${instruction.result} = fcmp ${instruction.condition} ${ins.LlvmType.F64} ${instruction.left}, ${instruction.right}`;
    }

    visitCastInstruction(instruction: ins.CastInstruction): string {
        return `${instruction.result} = ${instruction.operation} ${instruction.srcType} ${valueToString(instruction.value, instruction.srcType)} to ${instruction.dstType}`;
    }
}

const instructionStringVisitor = new InstructionStringVisitor();

export function instructionToString(instruction: ins.Instruction): string {
    return instruction.accept(instructionStringVisitor);
}
