
import assert from 'assert';

import * as ir from 'graphir';

import * as stmt from './ast/stmt.js';
import * as expr from './ast/expr.js';
import { Decl, LabelDecl, ParamDecl, VarDecl } from './ast/decl.js';

import * as type from './type/type.js';
import * as libType from './type/lib_types.js';
import { irTypeToCppType } from './type/type_conversion.js';

type AstNode = stmt.Stmt | Decl;

class CppCodeGenVisitor implements ir.VertexVisitor<AstNode | void> {
    constructor(private readonly namesMap: Map<ir.Vertex, string>) { }

    visitLiteralVertex(vertex: ir.LiteralVertex): AstNode {
        const name = this.namesMap.get(vertex)!;
        assert(vertex.value !== undefined && vertex.value !== null);
        let type = irTypeToCppType(vertex.verifiedType!);
        const stmt = new VarDecl(type, name, new expr.LiteralExpr(vertex.value));
        return stmt;
    }

    visitStaticSymbolVertex(vertex: ir.StaticSymbolVertex): void {}

    visitParameterVertex(vertex: ir.ParameterVertex): void {}

    visitPrefixUnaryOperationVertex(vertex: ir.PrefixUnaryOperationVertex): AstNode {
        const name = this.namesMap.get(vertex)!;
        let type = irTypeToCppType(vertex.verifiedType!);
        const operandValue = new expr.IdentifierExpr(this.namesMap.get(vertex.operand!)!);
        const exprValue = new expr.PrefixUnaryOperationExpr(vertex.operator, operandValue);
        const stmt = new VarDecl(type, name, exprValue);
        return stmt;
    }

    visitPostfixUnaryOperationVertex(vertex: ir.PostfixUnaryOperationVertex): AstNode {
        const name = this.namesMap.get(vertex)!;
        let type = irTypeToCppType(vertex.verifiedType!);
        const operandValue = new expr.IdentifierExpr(this.namesMap.get(vertex.operand!)!);
        const exprValue = new expr.PostfixUnaryOperationExpr(vertex.operator, operandValue);
        const stmt = new VarDecl(type, name, exprValue);
        return stmt;
    }

    visitBinaryOperationVertex(vertex: ir.BinaryOperationVertex): AstNode {
        const name = this.namesMap.get(vertex)!;
        let type = irTypeToCppType(vertex.verifiedType!);
        const leftValue = new expr.IdentifierExpr(this.namesMap.get(vertex.left!)!);
        const rightValue = new expr.IdentifierExpr(this.namesMap.get(vertex.right!)!);
        const exprValue = new expr.BinaryOperationExpr(vertex.operator, leftValue, rightValue);
        const stmt = new VarDecl(type, name, exprValue);
        return stmt;
    }

    visitPhiVertex(vertex: ir.PhiVertex): AstNode {
        throw new Error('Method not implemented.');
    }

    visitStartVertex(vertex: ir.StartVertex): AstNode {
        return new LabelDecl('start');
    }

    visitPassVertex(vertex: ir.PassVertex): void {}

    visitBlockBeginVertex(vertex: ir.BlockBeginVertex): AstNode {
        return new LabelDecl(this.namesMap.get(vertex)!);
    }

    visitBlockEndVertex(vertex: ir.BlockEndVertex): AstNode {
        return new stmt.GotoStmt(this.namesMap.get(vertex.next!)!);
    }

    visitReturnVertex(vertex: ir.ReturnVertex): AstNode {
        const valueExpr = vertex.value ? new expr.IdentifierExpr(this.namesMap.get(vertex.value!)!) : undefined;
        return new stmt.ReturnStmt(valueExpr);
    }

    visitBranchVertex(vertex: ir.BranchVertex): AstNode {
        throw new Error('Method not implemented.');
    }

    visitMergeVertex(vertex: ir.MergeVertex): AstNode {
        throw new Error('Method not implemented.');
    }

    visitAllocationVertex(vertex: ir.AllocationVertex): AstNode {
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
        return new VarDecl(ptrType, this.namesMap.get(vertex)!, init);
    }

    visitStoreVertex(vertex: ir.StoreVertex): AstNode {
        assert(vertex.object!.verifiedType instanceof ir.StaticArrayType || vertex.object!.verifiedType! instanceof ir.DynamicArrayType);
        const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
        const left = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
        const right = new expr.IdentifierExpr(this.namesMap.get(vertex.value!)!);
        return new stmt.ExprStmt(new expr.BinaryOperationExpr('=', left, right));
    }

    visitLoadVertex(vertex: ir.LoadVertex): AstNode {
        let right: expr.Expr;
        let varType: type.Type;
        if (vertex.object!.verifiedType instanceof ir.StaticArrayType || vertex.object!.verifiedType! instanceof ir.DynamicArrayType) {
            const derefExpr = new expr.PrefixUnaryOperationExpr('*', new expr.IdentifierExpr(this.namesMap.get(vertex.object!)!));
            right = new expr.SubscriptExpr(derefExpr, new expr.IdentifierExpr(this.namesMap.get(vertex.property!)!));
            varType = irTypeToCppType(vertex.verifiedType!);
        }
        else {
            right = new expr.IdentifierExpr(`${this.namesMap.get(vertex.object!)!}.${this.namesMap.get(vertex.property!)!}`);
            varType = new type.RefereceType(new type.AutoType());
        }
        return new VarDecl(varType, this.namesMap.get(vertex)!, right);
    }

    visitCallVertex(vertex: ir.CallVertex): AstNode {
        const args = vertex.args!.map(arg => new expr.IdentifierExpr(this.namesMap.get(arg)!));
        const call = new expr.CallExpr(this.namesMap.get(vertex.callee!)!, args);
        if (vertex.verifiedType instanceof ir.VoidType) {
            return new stmt.ExprStmt(call);
        }
        else {
            return new VarDecl(irTypeToCppType(vertex.verifiedType!), this.namesMap.get(vertex)!, call);
        }
    }
}

export { CppCodeGenVisitor, AstNode };
