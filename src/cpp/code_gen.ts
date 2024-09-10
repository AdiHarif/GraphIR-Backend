
import assert from 'assert';

import * as ir from 'graphir';

import * as stmt from './ast/stmt.js';
import * as expr from './ast/expr.js';
import { Decl, LabelDecl, ParamDecl, VarDecl } from './ast/decl.js';

import * as type from './type/type.js';
import * as libType from './type/lib_types.js';
import { irTypeToCppType } from './type/type_conversion.js';

type AstNode = stmt.Stmt | Decl;

class CppCodeGenVisitor implements ir.VertexVisitor<Array<AstNode>> {
    constructor(private readonly namesMap: Map<ir.Vertex, string>) { }

    private static createAssignmentStatement(name: string, value: expr.Expr): stmt.ExprStmt {
        return new stmt.ExprStmt(new expr.BinaryOperationExpr('=', new expr.IdentifierExpr(name), value));
    }

    visitLiteralVertex(vertex: ir.LiteralVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        assert(vertex.value !== undefined && vertex.value !== null);
        return [CppCodeGenVisitor.createAssignmentStatement(name, new expr.LiteralExpr(vertex.value))];
    }

    visitStaticSymbolVertex(vertex: ir.StaticSymbolVertex): Array<AstNode> {
        return [];
    }

    visitParameterVertex(vertex: ir.ParameterVertex): Array<AstNode> {
        return [];
    }

    visitPrefixUnaryOperationVertex(vertex: ir.PrefixUnaryOperationVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        const operandValue = new expr.IdentifierExpr(this.namesMap.get(vertex.operand!)!);
        const exprValue = new expr.PrefixUnaryOperationExpr(vertex.operator, operandValue);
        return [CppCodeGenVisitor.createAssignmentStatement(name, exprValue)];
    }

    visitPostfixUnaryOperationVertex(vertex: ir.PostfixUnaryOperationVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        const operandValue = new expr.IdentifierExpr(this.namesMap.get(vertex.operand!)!);
        const exprValue = new expr.PostfixUnaryOperationExpr(vertex.operator, operandValue);
        return [CppCodeGenVisitor.createAssignmentStatement(name, exprValue)];
    }

    visitBinaryOperationVertex(vertex: ir.BinaryOperationVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        let leftValue: expr.Expr = new expr.IdentifierExpr(this.namesMap.get(vertex.left!)!);
        let rightValue: expr.Expr = new expr.IdentifierExpr(this.namesMap.get(vertex.right!)!);
        if (vertex.operator == '%') {
            leftValue = new expr.CastingExpr(new type.IntType(32), leftValue);
            rightValue = new expr.CastingExpr(new type.IntType(32), rightValue);
        }
        const exprValue = new expr.BinaryOperationExpr(vertex.operator, leftValue, rightValue);
        return [CppCodeGenVisitor.createAssignmentStatement(name, exprValue)];
    }

    visitPhiVertex(vertex: ir.PhiVertex): Array<AstNode> {
        return [];
    }

    visitStartVertex(vertex: ir.StartVertex): Array<AstNode> {
        return [new LabelDecl('start')];
    }

    visitPassVertex(vertex: ir.PassVertex): Array<AstNode> {
        return [];
    }

    visitBlockBeginVertex(vertex: ir.BlockBeginVertex): Array<AstNode> {
        return [new LabelDecl(this.namesMap.get(vertex)!)];
    }

    visitBlockEndVertex(vertex: ir.BlockEndVertex): Array<AstNode> {
        let out: Array<AstNode> = vertex.next!.phiVertices.map(phi => {
            const value = phi.operands.find(op => op.srcBranch == vertex)!.value;
            const valueExpr = CppCodeGenVisitor.createAssignmentStatement(
                this.namesMap.get(phi)!,
                new expr.IdentifierExpr(this.namesMap.get(value)!)
            );
            return new stmt.ExprStmt(valueExpr);
        });

        out.push(new stmt.GotoStmt(this.namesMap.get(vertex.next!)!));
        return out;
    }

    visitReturnVertex(vertex: ir.ReturnVertex): Array<AstNode> {
        const valueExpr = vertex.value ? new expr.IdentifierExpr(this.namesMap.get(vertex.value!)!) : undefined;
        return [new stmt.ReturnStmt(valueExpr)];
    }

    visitBranchVertex(vertex: ir.BranchVertex): Array<AstNode> {
        let out: Array<AstNode> = [];
        const condition = new expr.IdentifierExpr(this.namesMap.get(vertex.condition!)!);
        const thenStmt = new stmt.GotoStmt(this.namesMap.get(vertex.trueNext!)!);
        if (vertex.falseNext) {
            const elseStmt = new stmt.GotoStmt(this.namesMap.get(vertex.falseNext)!);
            out.push(new stmt.IfStmt(condition, thenStmt, elseStmt));
        }
        else {
            out.push(new stmt.IfStmt(condition, thenStmt));
        }
        return out;
    }

    visitMergeVertex(vertex: ir.MergeVertex): Array<AstNode> {
        return [new LabelDecl(this.namesMap.get(vertex)!)];
    }

    visitAllocationVertex(vertex: ir.AllocationVertex): Array<AstNode> {
        const ptrType = irTypeToCppType(vertex.verifiedType!);
        assert(ptrType instanceof libType.SharedPointerType);
        const arrayType = ptrType.elementType;
        let initArg;
        if (vertex.args!.length === 1) {
            initArg = new expr.IdentifierExpr(this.namesMap.get(vertex.args![0])!);
        }
        else {
            initArg = new expr.StructLiteralExpr(vertex.args!.map(arg => new expr.IdentifierExpr(this.namesMap.get(arg)!)));
            initArg = new expr.CastingExpr(arrayType, initArg);
        }
        const init = new expr.TemplateCallExpr('std::make_shared', [initArg], [arrayType]);
        const name = this.namesMap.get(vertex)!;
        return [CppCodeGenVisitor.createAssignmentStatement(name, init)];
    }

    visitStoreVertex(vertex: ir.StoreVertex): Array<AstNode> {
        assert(vertex.object!.verifiedType instanceof ir.StaticArrayType || vertex.object!.verifiedType instanceof ir.DynamicArrayType || vertex.object!.verifiedType instanceof ir.UnionType);
        const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
        const left = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
        const right = new expr.IdentifierExpr(this.namesMap.get(vertex.value!)!);
        return [new stmt.ExprStmt(new expr.BinaryOperationExpr('=', left, right))];
    }

    visitLoadVertex(vertex: ir.LoadVertex): Array<AstNode> {
        let right: expr.Expr;
        const name = this.namesMap.get(vertex)!;
        if (vertex.object!.verifiedType instanceof ir.StaticArrayType || vertex.object!.verifiedType instanceof ir.DynamicArrayType || vertex.object!.verifiedType instanceof ir.UnionType) {
            const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
            right = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
        }
        else {
            right = new expr.IdentifierExpr(`_${this.namesMap.get(vertex.object!)!}._${this.namesMap.get(vertex.property!)!}`);
        }
        return [CppCodeGenVisitor.createAssignmentStatement(name, right)];
    }

    visitCallVertex(vertex: ir.CallVertex): Array<AstNode> {
        const args = vertex.args!.map(arg => new expr.IdentifierExpr(this.namesMap.get(arg)!));
        const call = new expr.CallExpr(this.namesMap.get(vertex.callee!)!, args);
        let out = [];
        if (vertex.verifiedType instanceof ir.VoidType) {
            out.push(new stmt.ExprStmt(call));
        }
        else {
            const name = this.namesMap.get(vertex)!;
            out.push(CppCodeGenVisitor.createAssignmentStatement(name, call));

        }
        return out;
    }
}

export { CppCodeGenVisitor, AstNode };
