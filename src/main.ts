
import * as ir from 'graphir'
import { extractFromPath } from 'ts-graph-extractor'

import { CodeGenIterable } from './codegen_iterable';
import { allocateNames } from './names_allocator';
import { InstructionGenVisitor } from './instruction_gen';
import { instructionToString } from './llvm_instructions/string_instruction';

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
    graph.setStartVertex(graph.vertices[1] as ir.StartVertex);
    generateLlvmIr(graph);
}

main();