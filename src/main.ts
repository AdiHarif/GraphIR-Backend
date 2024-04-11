
import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as ir from 'graphir'
import { extractFromPath } from 'ts-graph-extractor'

import { CodeGenIterable } from './codegen_iterable.js';
import { allocateNames } from './names_allocator.js';
import { InstructionGenVisitor } from './instruction_gen.js';
import { instructionToString } from './llvm_instructions/string_instruction.js';

function parseCliArgs() {
    return yargs(hideBin(process.argv))
        .option('input-file', { alias: 'i', type: 'string', description: 'Input file', demandOption: true })
        .option('out-file', { alias: 'o', type: 'string', description: 'Output file'})
        .parseSync();
}

const args = parseCliArgs();

function generateLlvmIr(graph: ir.Graph): void {
    const names = allocateNames(graph);
    const instructionGenVisitor = new InstructionGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const instructions = vertex.accept(instructionGenVisitor);
        for (let instruction of instructions) {
            if (!args['out-file']) {
                console.log(instructionToString(instruction));
            }
            else {
                fs.appendFileSync(args['out-file'], instructionToString(instruction) + '\n');
            }
        }
    }
}

function main() {
    const graph = extractFromPath(args['input-file']);
    if (args['out-file']) {
        fs.writeFileSync(args['out-file'], '');
    }
    graph.setStartVertex(graph.subgraphs[0].vertices[0] as ir.StartVertex);
    generateLlvmIr(graph);
}

main();