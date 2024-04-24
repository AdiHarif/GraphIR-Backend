
import * as ir from "graphir";

import * as ins from "./llvm_instructions/instruction.js";
import { irTypeToLlvmType, LlvmPrimitiveType } from "./llvm_instructions/type.js";

const numericOperatorsMap = new Map<ir.Operator, ins.LlvmNumericOperation>([
    ['+', ins.LlvmNumericOperation.Add],
    ['-', ins.LlvmNumericOperation.Sub],
    ['*', ins.LlvmNumericOperation.Mul],
    ['/', ins.LlvmNumericOperation.Div],
]);

const bitwiseOperatorsMap = new Map<ir.Operator, ins.LlvmNumericOperation>([
    ['>>', ins.LlvmNumericOperation.ARShift],
    ['>>>', ins.LlvmNumericOperation.LRShift]
]);

const comparisonOperatorsMap = new Map<ir.Operator, ins.LlvmCondition>([
    ['==', ins.LlvmCondition.Eq],
    ['!=', ins.LlvmCondition.Ne],
    ['<', ins.LlvmCondition.Lt],
]);

export class InstructionGenVisitor implements ir.VertexVisitor<Array<ins.Instruction>> {
    constructor(private readonly namesMap: Map<ir.Vertex, ins.NamedValue>) { }

    visitLiteralVertex(vertex: ir.LiteralVertex): Array<ins.Instruction> {
        const instruction = new ins.BinaryOperationInstruction(
            this.namesMap.get(vertex)!,
            irTypeToLlvmType(vertex.verifiedType!),
            ins.LlvmNumericOperation.Add,
            0,
            (vertex.value as number)!
        );
        return [instruction];
    }

    visitSymbolVertex(vertex: ir.SymbolVertex): Array<ins.Instruction> {
        return [];
    }

    visitParameterVertex(vertex: ir.ParameterVertex): Array<ins.Instruction> {
        return [];
    }

    visitPrefixUnaryOperationVertex(vertex: ir.PrefixUnaryOperationVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }

    visitPostfixUnaryOperationVertex(vertex: ir.PostfixUnaryOperationVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }

    visitBinaryOperationVertex(vertex: ir.BinaryOperationVertex): Array<ins.Instruction> {
        const op = vertex.operator;
        const out = [];
        if (numericOperatorsMap.has(op)) {
            out.push(new ins.BinaryOperationInstruction(
                this.namesMap.get(vertex)!,
                irTypeToLlvmType(vertex.verifiedType!),
                numericOperatorsMap.get(op)!,
                this.namesMap.get(vertex.left!)!,
                this.namesMap.get(vertex.right!)!
            ));
        }
        else if (comparisonOperatorsMap.has(op)) {
            out.push(new ins.ComparisonInstruction(
                this.namesMap.get(vertex)!,
                comparisonOperatorsMap.get(op)!,
                this.namesMap.get(vertex.left!)!,
                this.namesMap.get(vertex.right!)!
            ));
        }
        // else if (bitwiseOperatorsMap.has(op)) {
        //     const tmpReg0 = `${this.namesMap.get(vertex)!}.0`;
        //     const tmpReg1 = `${this.namesMap.get(vertex)!}.1`;
        //     const tmpReg2 = `${this.namesMap.get(vertex)!}.2`;
        //     const castLeft = new ins.CastInstruction(
        //         tmpReg0,
        //         ins.LlvmCastOperation.FpToSi,
        //         type.LlvmPrimitiveType.F64,
        //         this.namesMap.get(vertex.left!)!,
        //         type.LlvmPrimitiveType.I64
        //     );
        //     const castRight = new ins.CastInstruction(
        //         tmpReg1,
        //         ins.LlvmCastOperation.FpToSi,
        //         type.LlvmPrimitiveType.F64,
        //         this.namesMap.get(vertex.right!)!,
        //         type.LlvmPrimitiveType.I64
        //     );
        //     const operation = new ins.BinaryOperationInstruction(
        //         tmpReg2,
        //         type.LlvmPrimitiveType.I64,
        //         bitwiseOperatorsMap.get(op)!,
        //         tmpReg0,
        //         tmpReg1
        //     );
        //     const castOut = new ins.CastInstruction(
        //         this.namesMap.get(vertex)!,
        //         ins.LlvmCastOperation.SiToFp,
        //         type.LlvmPrimitiveType.I64,
        //         tmpReg2,
        //         type.LlvmPrimitiveType.F64
        //     );
        //     out.push(castLeft, castRight, operation, castOut);
        // }
        else {
            throw new Error(`Unsupported binary operation ${op}`);
        }
        return out;
    }

    visitPhiVertex(vertex: ir.PhiVertex): Array<ins.Instruction> {
        const operands = vertex.operands.map(operand =>
            [
                this.namesMap.get(operand.value)!,
                this.namesMap.get(operand.srcBranch)!,
            ]
        );
        const instruction = new ins.PhiInstruction(
            this.namesMap.get(vertex)!,
            irTypeToLlvmType(vertex.verifiedType!),
            operands as Array<[ins.Value, ins.Label]>
        );
        return [instruction];
    }

    visitStartVertex(vertex: ir.StartVertex): Array<ins.Instruction> {
        return [new ins.LabelInstruction(this.namesMap.get(vertex)!)];
    }

    visitPassVertex(vertex: ir.PassVertex): Array<ins.Instruction> {
        return [];

    }

    visitBlockBeginVertex(vertex: ir.BlockBeginVertex): ins.Instruction[] {
        const instruction = new ins.LabelInstruction(this.namesMap.get(vertex)!);
        return [instruction];
    }

    visitBlockEndVertex(vertex: ir.BlockEndVertex): Array<ins.Instruction> {
        const instruction = new ins.JumpInstruction(this.namesMap.get(vertex.next!)!);
        return [instruction];
    }

    visitReturnVertex(vertex: ir.ReturnVertex): Array<ins.Instruction> {
        let instruction;
        if (vertex.value) {
            instruction = new ins.ReturnInstruction(
                irTypeToLlvmType(vertex.value.verifiedType!),
                this.namesMap.get(vertex.value)!
            );
        }
        else {
            instruction = new ins.ReturnInstruction(LlvmPrimitiveType.Void);
        }
        return [instruction];
    }

    visitBranchVertex(vertex: ir.BranchVertex): Array<ins.Instruction> {
        const instruction = new ins.BranchInstruction(
            this.namesMap.get(vertex.condition!)!,
            this.namesMap.get(vertex.trueNext!)!,
            this.namesMap.get(vertex.falseNext!)!
        );
        return [instruction];
    }

    visitMergeVertex(vertex: ir.MergeVertex): Array<ins.Instruction> {
        const instruction = new ins.LabelInstruction(this.namesMap.get(vertex)!);
        return [instruction];
    }

    visitAllocationVertex(vertex: ir.AllocationVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }

    visitStoreVertex(vertex: ir.StoreVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }

    visitLoadVertex(vertex: ir.LoadVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }

    visitCallVertex(vertex: ir.CallVertex): Array<ins.Instruction> {
        throw new Error("Method not implemented.");
    }
}
