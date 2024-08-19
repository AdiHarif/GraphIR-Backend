
import fs from 'fs';
import assert from 'assert';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as ir from 'graphir'
import { extractFromPath } from 'ts-graph-extractor'

import { Function, ReturnInstruction } from './llvm_instructions/instruction.js';
import { CodeGenIterable } from './codegen_iterable.js';
import { allocateLlvmNames } from './llvm_instructions/names_allocator.js';
import { LlvmInstructionGenVisitor } from './llvm_instructions/instruction_gen.js';
import { instructionToString } from './llvm_instructions/string_instruction.js';
import { LlvmFunctionType, LlvmIntegerType } from './llvm_instructions/type/type.js';
import { irTypeToLlvmType } from './llvm_instructions/type/type_conversion.js';
import { hydrateTypesFromFiles } from './type_hydration.js';
import { instantiateLib } from './instantiation.js';

import { ContextManager } from './context_manager.js';
import { LlvmContextManager } from './llvm_instructions/context_manager.js';
import { CppContextManager } from './cpp/context_manager.js';
import { irTypeToCppType } from './cpp/type/type_conversion.js';

import * as cppType from './cpp/type/type.js';
import * as decl from './cpp/ast/decl.js';
import * as stmt from './cpp/ast/stmt.js';
import * as expr from './cpp/ast/expr.js';
import { CppCodeGenVisitor, AstNode } from './cpp/code_gen.js';
import { allocateCppNames } from './cpp/names_allocator.js';

function parseCliArgs() {
    return yargs(hideBin(process.argv))
        .option('input-file', { alias: 'i', type: 'string', description: 'Input file', demandOption: true })
        .option('out-file', { alias: 'o', type: 'string', description: 'Output file'})
        .option('types-file', { alias: 't', type: 'string', description: 'Types file', demandOption: true})
        .option('format', { alias: 'f', type: 'string', description: 'Output format', choices: ['llvm', 'cpp'], default: 'cpp'})
        .option('instantiate-libs',{boolean: true, description: 'Instantiate required libraries from templates', default: false})
        .option('instantiate-dir', {type: 'string', description: 'Directory to instantiate libraries', default: 'out'})
        .parseSync();
}

const args = parseCliArgs();

function generateContext(graph: ir.Graph, contextManager: ContextManager): void {
    function registerUsedNonPrimitiveTypes(graph: ir.Graph): void {
        const usedTypes = new Array<ir.Type>();
        for (const subgraph of graph.subgraphs) {
            registerUsedNonPrimitiveTypes(subgraph);
        }
        for (const vertex of graph.vertices) {
            if (vertex instanceof ir.StaticSymbolVertex) {
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
    contextManager.dump(args['out-file'])
}

function generateLlvmIr(graph: ir.Graph): void {
    for (const subgraph of graph.subgraphs) {
        generateLlvmIr(subgraph);
    }
    let function_name;
    if (graph.getStartVertex().inEdges.length > 0) {
        function_name = (graph.getStartVertex().inEdges[0].source as ir.StaticSymbolVertex).name;
    }
    else {
        function_name = 'main';
    }
    const function_type = irTypeToLlvmType(graph.verifiedType!) as LlvmFunctionType;
    const llvm_function = new Function(function_name, function_type);
    const names = allocateLlvmNames(graph);
    const instructionGenVisitor = new LlvmInstructionGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const instructions = vertex.accept(instructionGenVisitor);
        llvm_function.instructions.push(...instructions);
    }
    if (function_name === 'main') {
        llvm_function.instructions.pop();
        llvm_function.instructions.push(new ReturnInstruction(new LlvmIntegerType(32), 0));
    }
    if (!args['out-file']) {
        console.log(instructionToString(llvm_function));
    }
    else {
        fs.appendFileSync(args['out-file'], instructionToString(llvm_function) + '\n');
    }
}

function generateCpp(graph: ir.Graph): void {
    for (const subgraph of graph.subgraphs) {
        generateCpp(subgraph);
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
    const instructionGenVisitor = new CppCodeGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const statement = vertex.accept<AstNode | void>(instructionGenVisitor);
        if (!statement) {
            continue;
        }
        cpp_function.body.statements.push(statement);
    }
    if (function_name === 'main') {
        cpp_function.body.statements.pop();
        cpp_function.body.statements.push(new stmt.ReturnStmt(new expr.LiteralExpr(0)));
    }
    if (!args['out-file']) {
        console.log(cpp_function.toString());
    }
    else {
        fs.appendFileSync(args['out-file'], cpp_function.toString() + '\n');
    }
}

function main() {
    const graph = extractFromPath(args['input-file']);
    hydrateTypesFromFiles(graph, args['types-file']);
    if (args['out-file']) {
        fs.writeFileSync(args['out-file'], '');
    }

    const contextManager = args.format == 'llvm' ? new LlvmContextManager() : new CppContextManager();
    generateContext(graph, contextManager);

    if (args.format == 'llvm') {
        generateLlvmIr(graph);
    }
    else {
        generateCpp(graph);
    }

    if (args.format == 'llvm' && args['instantiate-libs']) {
        for (const instantiation of (contextManager as LlvmContextManager).instantiations) {
            instantiateLib(instantiation, args['instantiate-dir']);
        }
    }
}

main();