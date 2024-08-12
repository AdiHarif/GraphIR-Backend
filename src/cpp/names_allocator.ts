
import * as ir from 'graphir';

import { CodeGenIterable } from '../codegen_iterable.js';

export function allocateCppNames(graph: ir.Graph): Map<ir.Vertex, string> {
    const map = new Map<ir.Vertex, string>();
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
            let regName: string;
            if (vertex.kind == ir.VertexKind.Parameter) {
                regName = `p${(vertex as ir.ParameterVertex).position}`;
            }
            else if (vertex instanceof ir.StaticSymbolVertex) {
                regName = `${vertex.name}`;
            }
            else {
                regName = `v${lastReg++}`;
            }
            map.set(vertex, regName);
        }
    }

    return map;
}