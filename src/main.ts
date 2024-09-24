
import assert from 'assert';
import * as ir from 'graphir'

import { CodeGenIterable } from './codegen_iterable.js';

import { ContextManager } from './context_manager.js';
import { irTypeToCppType } from './cpp/type/type_conversion.js';

import * as cppType from './cpp/type/type.js';
import * as decl from './cpp/ast/decl.js';
import * as stmt from './cpp/ast/stmt.js';
import * as expr from './cpp/ast/expr.js';
import { CppCodeGenVisitor, AstNode } from './cpp/code_gen.js';
import { allocateCppNames } from './cpp/names_allocator.js';


export function generateContext(graph: ir.Graph, contextManager: ContextManager): void {
    function registerUsedNonPrimitiveTypes(graph: ir.Graph): void {
        const usedTypes = new Array<ir.Type>();
        for (const subgraph of graph.subgraphs) {
            registerUsedNonPrimitiveTypes(subgraph);
        }
        for (const vertex of graph.vertices) {
            if (vertex instanceof ir.StaticSymbolVertex) {
                contextManager.registerSymbol(vertex);
                continue;
            }
            if (vertex instanceof ir.DataVertex || vertex instanceof ir.CompoundVertex) {
                assert(vertex.verifiedType);
                contextManager.registerType(vertex.verifiedType);
            }
        }
    }

    function registerStaticStrings(graph: ir.Graph): void {
        for (const subgraph of graph.subgraphs) {
            registerStaticStrings(subgraph);
        }
        for (const vertex of graph.vertices) {
            if (vertex instanceof ir.LiteralVertex && typeof vertex.value === 'string') {
                contextManager.registerStaticString(vertex.id, vertex.value);
            }
        }
    }

    registerUsedNonPrimitiveTypes(graph);
    registerStaticStrings(graph);
}


export function generateCpp(graph: ir.Graph): string {
    let out = '';
    for (const subgraph of graph.subgraphs) {
        out += generateCpp(subgraph);
    }
    let function_name;
    if (graph.getStartVertex().inEdges.length > 0) {
        function_name = (graph.getStartVertex().inEdges[0].source as ir.StaticSymbolVertex).name;
    }
    else {
        function_name = 'main';
    }
    const function_type = (irTypeToCppType(graph.verifiedType!) as cppType.FunctionType);
    const parameters = function_type.parameters.map((t, i) => new decl.ParamDecl(t, `p${i}`));
    const cpp_function = new decl.FuncDecl(function_type.returnType, function_name, parameters, new stmt.BlockStmt([]));
    const names = allocateCppNames(graph);

    const dataVertices = [...new CodeGenIterable(graph)]
        .filter(v => (v instanceof ir.DataVertex || v instanceof ir.CompoundVertex) && !(v instanceof ir.StaticSymbolVertex))
        .filter(v => !(v instanceof ir.ParameterVertex))

    const variableDeclarations = dataVertices
        .filter(v => !((v as ir.DataVertex).verifiedType! instanceof ir.VoidType) && !((v as ir.DataVertex).verifiedType! instanceof ir.FunctionType))
        .map(v => new decl.VarDecl(irTypeToCppType((v as ir.DataVertex).verifiedType!), names.get(v)!));
    cpp_function.body.statements.push(...variableDeclarations);

    const functorVariableDeclarations = dataVertices
        .filter(v => (v as ir.DataVertex).verifiedType! instanceof ir.FunctionType)
        .map(v => {
            assert(v instanceof ir.LoadVertex);
            let type;
            if (v.verifiedType instanceof ir.StaticArrayType || v.verifiedType instanceof ir.DynamicArrayType) {
                type = irTypeToCppType(v.verifiedType!);
            }
            else {
                assert(v instanceof ir.LoadVertex);
                assert(v.object instanceof ir.StaticSymbolVertex && v.property instanceof ir.StaticSymbolVertex);
                type = new cppType.ScopedType(v.object.name, v.property.name);
            }
            return new decl.VarDecl(type, names.get(v)!);
        });
    cpp_function.body.statements.push(...functorVariableDeclarations);

    const instructionGenVisitor = new CppCodeGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const statement = vertex.accept(instructionGenVisitor);
        if (!statement) {
            continue;
        }
        cpp_function.body.statements.push(...statement);
    }
    if (function_name === 'main') {
        cpp_function.body.statements.pop();
        cpp_function.body.statements.push(new stmt.ReturnStmt(new expr.LiteralExpr(0)));
    }

    out += cpp_function.toString() + '\n';
    return out;
}
