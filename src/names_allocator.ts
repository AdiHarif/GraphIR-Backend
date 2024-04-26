
import assert from 'assert';

import * as ir from 'graphir';

import { NamedValue, Label } from './llvm_instructions/instruction.js';
import { CodeGenIterable } from './codegen_iterable.js';

export function allocateNames(graph: ir.Graph): Map<ir.Vertex, NamedValue> {
    const map = new Map<ir.Vertex, NamedValue>();
    const tmpControlMap = new Map<ir.ControlVertex, Label>();
    let lastReg = 0;
    let lastLabel = 0;
    const iterableGraph = new CodeGenIterable(graph);
    let name;
    for (let vertex of iterableGraph) {
        if (vertex.category == ir.VertexCategory.Data || vertex.category == ir.VertexCategory.Compound) {
            if (vertex.kind == ir.VertexKind.Parameter) {
                name = `%${(vertex as ir.ParameterVertex).position}`;
            }
            else {
                name = `%r${lastReg++}`;
            }
            map.set(vertex, name);
        }
        switch (vertex.kind) {
            case ir.VertexKind.Start:
            case ir.VertexKind.BlockStart:
            case ir.VertexKind.Merge:
                name = `l${lastLabel++}`;
                map.set(vertex, name);
                tmpControlMap.set(vertex as ir.ControlVertex, name);
                break;
            case ir.VertexKind.Branch:
            case ir.VertexKind.Return:
            case ir.VertexKind.BlockEnd:
                map.set(vertex, tmpControlMap.get(vertex as ir.ControlVertex)!);
                break;
        }
        if (vertex instanceof ir.NonTerminalControlVertex) {
            tmpControlMap.set(vertex.next!, map.get(vertex)!);
        }
    };
    return map;
}
