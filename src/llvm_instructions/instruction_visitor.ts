
import * as ins from "./instruction.js";

export interface InstructionVisitor<T> {
    visitBinaryOperationInstruction(instruction: ins.BinaryOperationInstruction): T;
    visitLabelInstruction(instruction: ins.LabelInstruction): T;
    visitVoidCallInstruction(instruction: ins.VoidCallInstruction): T;
    visitCallInstruction(instruction: ins.CallInstruction): T;
    visitReturnInstruction(instruction: ins.ReturnInstruction): T;
    visitJumpInstruction(instruction: ins.JumpInstruction): T;
    visitBranchInstruction(instruction: ins.BranchInstruction): T;
    visitPhiInstruction(instruction: ins.PhiInstruction): T;
    visitComparisonInstruction(instruction: ins.ComparisonInstruction): T;
    visitCastInstruction(instruction: ins.CastInstruction): T;
}
