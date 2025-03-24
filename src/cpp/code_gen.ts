
import assert from 'assert';

import * as ir from 'graphir';

import * as stmt from './ast/stmt.js';
import * as expr from './ast/expr.js';
import { Decl, LabelDecl, ParamDecl, VarDecl } from './ast/decl.js';

import * as type from './type/type.js';
import * as libType from './type/lib_types.js';
import { irTypeToCppType } from './type/type_conversion.js';
import * as customTypes from './type/custom_types.js';

type AstNode = stmt.Stmt | Decl;

class CppCodeGenVisitor implements ir.VertexVisitor<Array<AstNode>> {
    constructor(private readonly namesMap: Map<ir.Vertex, string>) { }

    private static createOwningAssignmentStatement(name: string, value: expr.Expr): stmt.ExprStmt {
        return new stmt.ExprStmt(new expr.BinaryOperationExpr('=', new expr.IdentifierExpr(name), value));
    }

    private static createRefAssignmentStatement(name: string, value: expr.Expr) {
        return new stmt.ExprStmt(new expr.BinaryOperationExpr('=', new expr.IdentifierExpr(name), new expr.PrefixUnaryOperationExpr('&', value)));
    }

    private createValueExpression(v: ir.Vertex) {
        assert(this.namesMap.has(v));
        let e: expr.Expr = new expr.IdentifierExpr(this.namesMap.get(v)!);
        if (v instanceof ir.LoadVertex && (v.verifiedType instanceof ir.DynamicArrayType || (v.verifiedType instanceof ir.UnionType && v.verifiedType.types.some(t => t instanceof ir.DynamicArrayType)))) {
            e = new expr.PrefixUnaryOperationExpr('*', e);
        }
        return e;
    }

    visitLiteralVertex(vertex: ir.LiteralVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        return [CppCodeGenVisitor.createOwningAssignmentStatement(name, new expr.LiteralExpr(vertex.value))];
    }

    visitStaticSymbolVertex(vertex: ir.StaticSymbolVertex): Array<AstNode> {
        return [];
    }

    visitParameterVertex(vertex: ir.ParameterVertex): Array<AstNode> {
        return [];
    }

    visitUnaryOperationVertex(vertex: ir.UnaryOperationVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        const operandValue = this.createValueExpression(vertex.operand!);
        let exprValue: expr.Expr;
        if (vertex.operator === '--' || vertex.operator === '++') {
            const op = vertex.operator === '--' ? '-' : '+';
            exprValue = new expr.BinaryOperationExpr(op, operandValue, new expr.LiteralExpr(1));
        }
        else {
            exprValue = new expr.PrefixUnaryOperationExpr(vertex.operator, operandValue);
        }
        return [CppCodeGenVisitor.createOwningAssignmentStatement(name, exprValue)];
    }

    visitBinaryOperationVertex(vertex: ir.BinaryOperationVertex): Array<AstNode> {
        const name = this.namesMap.get(vertex)!;
        let leftValue: expr.Expr = this.createValueExpression(vertex.left!);
        let rightValue: expr.Expr = this.createValueExpression(vertex.right!);
        const integerOperators = ['%', '<<', '>>', '&', '|', '^'];
        let op = vertex.operator;
        if (integerOperators.includes(vertex.operator)) {
            leftValue = new expr.CastingExpr(new type.IntType(64), leftValue);
            rightValue = new expr.CastingExpr(new type.IntType(64), rightValue);
        }
        else if (vertex.operator === '>>>') {
            op = '>>';
            leftValue = new expr.CastingExpr(new type.UnsignedIntType(64), leftValue);
            rightValue = new expr.CastingExpr(new type.IntType(64), rightValue);
        }
        else if (vertex.operator === '===' || vertex.operator === '!==') {
            const functionName = "_strictEquals";
            const call = new expr.CallExpr(functionName, [leftValue, rightValue]);
            return [CppCodeGenVisitor.createOwningAssignmentStatement(name, call)]
        }
        const exprValue = new expr.BinaryOperationExpr(op, leftValue, rightValue);
        return [CppCodeGenVisitor.createOwningAssignmentStatement(name, exprValue)];
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
            const valueExpr = CppCodeGenVisitor.createOwningAssignmentStatement(
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

    visitThrowVertex(vertex: ir.ThrowVertex): Array<AstNode> {
        return [new stmt.ThrowStmt(this.createValueExpression(vertex.value!))];
    }

    visitBranchVertex(vertex: ir.BranchVertex): Array<AstNode> {
        let out: Array<AstNode> = [];
        const condition = this.createValueExpression(vertex.condition!);
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
        const objType = irTypeToCppType(vertex.verifiedType!);
        let initArgs;
        if (objType instanceof customTypes.DynamicArrayType && vertex.args!.length !== 1) {
            initArgs = [new expr.StructLiteralExpr(vertex.args!.map(arg => this.createValueExpression(arg)!))];
        }
        else {
            initArgs = vertex.args!.map(arg => this.createValueExpression(arg)!);
        }
        const init = new expr.CallExpr(objType.toString(), initArgs);
        const name = this.namesMap.get(vertex)!;
        return [CppCodeGenVisitor.createOwningAssignmentStatement(name, init)];
    }

    visitStoreVertex(vertex: ir.StoreVertex): Array<AstNode> {
        // assert(vertex.object!.verifiedType instanceof ir.StaticArrayType || vertex.object!.verifiedType instanceof ir.DynamicArrayType || vertex.object!.verifiedType instanceof ir.UnionType);
        // const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
        // const left = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
        // const right = new expr.IdentifierExpr(this.namesMap.get(vertex.value!)!);
        // return [new stmt.ExprStmt(new expr.BinaryOperationExpr('=', left, right))];

        let left: expr.Expr;
        let right = this.createValueExpression(vertex.value!);
        if (vertex.object!.verifiedType instanceof ir.DynamicArrayType || vertex.object!.verifiedType instanceof ir.UnionType || vertex.object!.verifiedType instanceof ir.ObjectType) {
            const objectExpression: expr.Expr = this.createValueExpression(vertex.object!);
            left = new expr.SubscriptExpr(objectExpression, this.createValueExpression(vertex.property!));
        }
        else {
            assert(vertex.object instanceof ir.StaticSymbolVertex && vertex.object.name === '_globals');
            assert(vertex.property instanceof ir.StaticSymbolVertex);
            left = new expr.MemberAccessExpr(new expr.IdentifierExpr('_globals'), vertex.property.name);
        }
        return [new stmt.ExprStmt(new expr.BinaryOperationExpr('=', left, right))];
    }

    visitLoadVertex(vertex: ir.LoadVertex): Array<AstNode> {
        let right: expr.Expr;
        const name = this.namesMap.get(vertex)!;
        if (vertex.object!.verifiedType instanceof ir.StaticArrayType) {
            const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
            right = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
        }
        else if ((vertex.object!.verifiedType instanceof ir.DynamicArrayType || vertex.object!.verifiedType instanceof ir.UnionType) && ! (vertex.property instanceof ir.StaticSymbolVertex)) {
            const objectExpression: expr.Expr = this.createValueExpression(vertex.object!);
            const property = this.createValueExpression(vertex.property!);
            right = new expr.SubscriptExpr(objectExpression, property);
            if (vertex.verifiedType instanceof ir.DynamicArrayType || (vertex.verifiedType instanceof ir.UnionType && vertex.verifiedType.types.some(t => t instanceof ir.DynamicArrayType))) {
                return [CppCodeGenVisitor.createRefAssignmentStatement(name, right)];
            }
        }
        else if (vertex.object instanceof ir.StaticSymbolVertex && vertex.property instanceof ir.StaticSymbolVertex) {
            if (vertex.object.name === '_globals') {
                right = new expr.MemberAccessExpr(new expr.IdentifierExpr('_globals'), vertex.property.name);
            }
            else {
                right = new expr.IdentifierExpr(`_${this.namesMap.get(vertex.object!)!}._${this.namesMap.get(vertex.property!)!}`);
            }

            if (vertex.verifiedType instanceof ir.DynamicArrayType ||
                vertex.verifiedType instanceof ir.UnionType && vertex.verifiedType.types.some(t => t instanceof ir.DynamicArrayType)) {
                return [CppCodeGenVisitor.createRefAssignmentStatement(name, right)];
            }
        }
        else if (vertex.verifiedType instanceof ir.FunctionType) {
            assert(vertex.property instanceof ir.StaticSymbolVertex);
            const argPlaceholders = vertex.verifiedType.parameterTypes.map((_, i) =>
                new expr.ScopedIdentifierExpr("std::placeholders", `_${i + 1}`));

            right = new expr.CallExpr(
                "std::bind",
                [
                    new expr.PrefixUnaryOperationExpr('&', new expr.ScopedIdentifierExpr(irTypeToCppType(vertex.object!.verifiedType!).toString(), vertex.property!.name)),
                    this.createValueExpression(vertex.object!),
                    ...argPlaceholders
                ]
            );
        }
        else {
            right = new expr.IdentifierExpr(`_${this.namesMap.get(vertex.object!)!}._${this.namesMap.get(vertex.property!)!}`);
        }
        return [CppCodeGenVisitor.createOwningAssignmentStatement(name, right)];
    }

    visitCallVertex(vertex: ir.CallVertex): Array<AstNode> {
        const args = vertex.args!.map(arg => this.createValueExpression(arg)!);
        const call = new expr.CallExpr(this.namesMap.get(vertex.callee!)!, args);
        let out = [];
        if (vertex.verifiedType instanceof ir.VoidType) {
            out.push(new stmt.ExprStmt(call));
        }
        else {
            const name = this.namesMap.get(vertex)!;
            out.push(CppCodeGenVisitor.createOwningAssignmentStatement(name, call));

        }
        return out;
    }
}

export { CppCodeGenVisitor, AstNode };
