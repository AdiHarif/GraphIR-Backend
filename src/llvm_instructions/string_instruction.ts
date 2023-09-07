
import * as ins from "./instruction";
import { InstructionVisitor } from "./instruction_visitor";

class InstructionStringVisitor implements InstructionVisitor<string> {
    visitBinaryOperationInstruction(instruction: ins.BinaryOperationInstruction): string {
        return `${instruction.result} = ${instruction.operation} ${instruction.resultType} ${instruction.left}, ${instruction.right}`;
    }

    visitLabelInstruction(instruction: ins.LabelInstruction): string {
        return `${instruction.label}:`;
    }

    visitVoidCallInstruction(instruction: ins.VoidCallInstruction): string {
        return `call void @${instruction.name}(${instruction.args.map(a => `${a.type} ${a.value}`).join(", ")})`;
    }

    visitCallInstruction(instruction: ins.CallInstruction): string {
        return `${instruction.result} = call ${instruction.resultType} @${instruction.name}(${instruction.args.map(a => `${a.type} ${a.value}`).join(", ")})`;
    }

    visitReturnInstruction(instruction: ins.ReturnInstruction): string {
        return `ret ${instruction.type} ${instruction.value}`;
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
        return `${instruction.result} = ${instruction.operation} ${instruction.srcType} ${instruction.value} to ${instruction.dstType}`;
    }
}

const instructionStringVisitor = new InstructionStringVisitor();

export function instructionToString(instruction: ins.Instruction): string {
    return instruction.accept(instructionStringVisitor);
}
