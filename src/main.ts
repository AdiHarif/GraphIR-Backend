
import * as ir from 'graphir'
import { extractFromPath } from 'ts-graph-extractor'

import { CodeGenIterable } from './codegen_iterable.js';
import { allocateNames } from './names_allocator.js';
import { InstructionGenVisitor } from './instruction_gen.js';
import { instructionToString } from './llvm_instructions/string_instruction.js';

function generateLlvmIr(graph: ir.Graph): void {
    const names = allocateNames(graph);
    const instructionGenVisitor = new InstructionGenVisitor(names);
    const iterableGraph = new CodeGenIterable(graph);
    for (let vertex of iterableGraph) {
        const instructions = vertex.accept(instructionGenVisitor);
        for (let instruction of instructions) {
            console.log(instructionToString(instruction));
        }
    }
}

function main() {
    const graph = extractFromPath('tmp4.ts');
    graph.setStartVertex(graph.subgraphs[0].vertices[0] as ir.StartVertex);
    generateLlvmIr(graph);
}

main();