
import * as ins from "./instruction.js";
import { LlvmType, LlvmNumericType } from "./type.js";
import { InstructionVisitor } from "./instruction_visitor.js";

function valueToString(value: ins.Value, type: LlvmType): string {
    if (typeof value === "string") {
        return value;
    }
    else if (type instanceof LlvmNumericType) {
        return type.getLiteralAsString(value);
    }
    else {
        throw new Error(`Unsupported type (${type.name}) and value (${value}) combination.`);
    }
}

class InstructionStringVisitor implements InstructionVisitor<string> {
    visitBinaryOperationInstruction(instruction: ins.BinaryOperationInstruction): string {
        const operation = instruction.resultType.getBinaryOperationInstructionString(instruction.operation);
        return `${instruction.result} = ${operation} ${instruction.resultType.name} ${valueToString(instruction.left, instruction.resultType)}, ${valueToString(instruction.right, instruction.resultType)}`;
    }

    visitLabelInstruction(instruction: ins.LabelInstruction): string {
        return `${instruction.label}:`;
    }

    visitVoidCallInstruction(instruction: ins.VoidCallInstruction): string {
        return `call void @${instruction.name}(${instruction.args.map(a => `${a.type!.name} ${valueToString(a.value, a.type!)}`).join(", ")})`;
    }

    visitCallInstruction(instruction: ins.CallInstruction): string {
        return `${instruction.result} = call ${instruction.resultType.name} @${instruction.name}(${instruction.args.map(a => `${a.type!.name} ${valueToString(a.value, a.type!)}`).join(", ")})`;
    }

    visitReturnInstruction(instruction: ins.ReturnInstruction): string {
        let out = `ret ${instruction.type.name}`;
        if (instruction.value) {
            out += ` ${valueToString(instruction.value!, instruction.type)}`;
        }
        return out;
    }

    visitJumpInstruction(instruction: ins.JumpInstruction): string {
        return `br label %${instruction.label}`;
    }

    visitBranchInstruction(instruction: ins.BranchInstruction): string {
        return `br i1 ${instruction.condition}, label %${instruction.trueLabel}, label %${instruction.falseLabel}`;
    }

    visitPhiInstruction(instruction: ins.PhiInstruction): string {
        return `${instruction.result} = phi ${instruction.resultType.name} ${instruction.operands.map(v => `[${v[0]}, %${v[1]}]`).join(", ")}`;
    }

    visitComparisonInstruction(instruction: ins.ComparisonInstruction): string {
        const comparisonInstruction = instruction.argsType.getComparisonInstructionString();
        const comparisonCondition = instruction.argsType.getComparisonConditionString(instruction.condition);
        return `${instruction.result} = ${comparisonInstruction} ${comparisonCondition} ${instruction.argsType.name} ${instruction.left}, ${instruction.right}`;
    }

    visitCastInstruction(instruction: ins.CastInstruction): string {
        return `${instruction.result} = ${instruction.operation} ${instruction.srcType.name} ${valueToString(instruction.value, instruction.srcType)} to ${instruction.dstType.name}`;
    }

    visitFunction(instruction: ins.Function): string {
        let out = `define ${instruction.functionType.result.name} @${instruction.name}`;
        if (instruction.functionType.parameters.length > 0) {
            out += `(${instruction.functionType.parameters.map(t => t.name).join(", ")})`;
        } else {
            out += "()";
        }
        out += " {\n";
        for (const i of instruction.instructions) {
            if (!(i instanceof ins.LabelInstruction)) {
                out += "\t";
            }
            out += `${i.accept(this)}\n`;
        }
        out += "}"
        return out;
    }
}

const instructionStringVisitor = new InstructionStringVisitor();

export function instructionToString(instruction: ins.Instruction): string {
    return instruction.accept(instructionStringVisitor);
}
