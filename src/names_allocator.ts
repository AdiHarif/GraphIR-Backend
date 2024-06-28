
import assert from 'assert';

import * as ir from 'graphir';

import { NamedValue, Label } from './llvm_instructions/instruction.js';
import { CodeGenIterable } from './codegen_iterable.js';

export function allocateNames(graph: ir.Graph): Map<ir.Vertex, NamedValue> {
    const map = new Map<ir.Vertex, NamedValue>();
    let lastLabel = 0;
    for (let vertex of new CodeGenIterable(graph)) {
        if (vertex.kind == ir.VertexKind.Start || vertex.kind == ir.VertexKind.BlockStart || vertex.kind == ir.VertexKind.Merge) {
            let labelName = `l${lastLabel++}`;
            map.set(vertex, labelName);
        }
        if (vertex instanceof ir.NonTerminalControlVertex) {
            map.set(vertex.next!, map.get(vertex)!);
        }
    }

    let lastReg = 0;
    for (let vertex of new CodeGenIterable(graph)) {
        if (vertex.category == ir.VertexCategory.Data || vertex.category == ir.VertexCategory.Compound) {
            let regName: NamedValue;
            if (vertex.kind == ir.VertexKind.Parameter) {
                regName = `%${(vertex as ir.ParameterVertex).position}`;
            }
            else {
                regName = `%r${lastReg++}`;
            }
            map.set(vertex, regName);
        }
    }

    return map;
}
