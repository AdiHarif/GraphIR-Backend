
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as ir from 'graphir'
import { extractFromPath } from 'ts-graph-extractor'

import { Function } from './llvm_instructions/instruction.js';
import { CodeGenIterable } from './codegen_iterable.js';
import { allocateNames } from './names_allocator.js';
import { InstructionGenVisitor } from './instruction_gen.js';
import { instructionToString } from './llvm_instructions/string_instruction.js';
import { LlvmFunctionType } from './llvm_instructions/type/type.js';
import { irTypeToLlvmType } from './llvm_instructions/type/type_conversion.js';
import { hydrateTypesFromFiles } from './type_hydration.js';

function parseCliArgs() {
    return yargs(hideBin(process.argv))
        .option('input-file', { alias: 'i', type: 'string', description: 'Input file', demandOption: true })
        .option('out-file', { alias: 'o', type: 'string', description: 'Output file'})
        .option('types-file', { alias: 't', type: 'string', description: 'Types file', demandOption: true})
        .parseSync();
}

const args = parseCliArgs();

function generateLlvmIr(graph: ir.Graph): void {
    for (const subgraph of graph.subgraphs) {
        generateLlvmIr(subgraph);
    }
    let function_name;
    if (graph.getStartVertex().inEdges.length > 0) {
        function_name = (graph.getStartVertex().inEdges[0].source as ir.SymbolVertex).name;
    }
    else {
        function_name = 'main';
    }
    const function_type = irTypeToLlvmType(graph.verifiedType!) as LlvmFunctionType;
    const llvm_function = new Function(function_name, function_type);
    const names = allocateNames(graph);
    const instructionGenVisitor = new InstructionGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const instructions = vertex.accept(instructionGenVisitor);
        llvm_function.instructions.push(...instructions);
    }
    if (!args['out-file']) {
        console.log(instructionToString(llvm_function));
    }
    else {
        fs.appendFileSync(args['out-file'], instructionToString(llvm_function) + '\n');
    }
}

function main() {
    const graph = extractFromPath(args['input-file']);
    hydrateTypesFromFiles(graph, args['types-file']);
    if (args['out-file']) {
        fs.writeFileSync(args['out-file'], '');
    }
    generateLlvmIr(graph);
}

main();