
import assert from 'assert';

import * as ir from 'graphir';

import { NamedValue } from './instruction';
import { CodeGenIterable } from './codegen_iterable';

export function allocateNames(graph: ir.Graph): Map<ir.Vertex, NamedValue> {
    const map = new Map<ir.Vertex, NamedValue>();
    let lastReg = 0;
    let lastLabel = 0;
    const iterableGraph = new CodeGenIterable(graph);
    let name;
    for (let vertex of iterableGraph) { // TODO: Avoid collisions with compound vertices
        if (vertex.category == ir.VertexCategory.Data || vertex.category == ir.VertexCategory.Compound) {
            if (vertex.kind == ir.VertexKind.Parameter) {
                name = `%${(vertex as ir.ParameterVertex).position}`;
            }
            else {
                name = `%r${lastReg++}`;
            }
            map.set(vertex, name);
        }
        if (vertex.category == ir.VertexCategory.Control || vertex.category == ir.VertexCategory.Compound) {
            switch (vertex.kind) {
                case ir.VertexKind.Branch:
                    map.set((vertex as ir.BranchVertex).trueNext!, `%l${lastLabel++}`);
                    map.set((vertex as ir.BranchVertex).falseNext!, `%l${lastLabel++}`);
                    break;
                case ir.VertexKind.Start:
                case ir.VertexKind.Merge:
                    name = `%l${lastLabel++}`;
                    map.set(vertex, name);
                    map.set((vertex as ir.NonTerminalControlVertex).next!, name);
                    break;
                case ir.VertexKind.Return:
                    break;
                default:
                    assert(map.has(vertex));
                    map.set((vertex as ir.NonTerminalControlVertex).next!, map.get(vertex)!);
            }
        }
    };
    return map;
}
