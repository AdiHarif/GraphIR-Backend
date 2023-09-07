
import { assert } from 'console';
import * as ir from 'graphir';

class CodeGenIterator implements Iterator<ir.Vertex> {
    private readonly visited = new Set<ir.Vertex>();
    private readonly processed = new Set<ir.Vertex>();

    private readonly verticesStack: Array<ir.Vertex> = [];

    constructor(private readonly graph: ir.Graph) {
        this.verticesStack.push(graph.getStartVertex());
    }

    private processStackTop() {
        const vertex = this.verticesStack[this.verticesStack.length - 1];
        if (this.processed.has(vertex)) {
            return;
        }
        this.processed.add(vertex);
        let currentTop;
        switch (vertex.kind) {
            case ir.VertexKind.Literal:
            case ir.VertexKind.Parameter:
            case ir.VertexKind.Symbol:
                break;
            case ir.VertexKind.PostfixUnaryOperation:
            case ir.VertexKind.PrefixUnaryOperation:
                this.verticesStack.push((vertex as ir.UnaryOperationVertex).operand!);
                break;
            case ir.VertexKind.BinaryOperation:
                this.verticesStack.push((vertex as ir.BinaryOperationVertex).right!);
                this.verticesStack.push((vertex as ir.BinaryOperationVertex).left!);
                break;
            case ir.VertexKind.Phi:
                this.verticesStack.push(...(vertex as ir.PhiVertex).operands.map(operand => operand.value));
                break;
            case ir.VertexKind.Start:
            case ir.VertexKind.Pass:
                currentTop = this.verticesStack.pop() as ir.NonTerminalControlVertex;
                if (!(currentTop.next instanceof ir.MergeVertex)) {
                    this.verticesStack.push(currentTop.next!);
                }
                this.verticesStack.push(currentTop);
                break;
            case ir.VertexKind.Branch:
                const branch = this.verticesStack.pop() as ir.BranchVertex;
                this.verticesStack.push(branch.merge!);
                if (!(branch.falseNext instanceof ir.MergeVertex)) {
                    this.verticesStack.push(branch.falseNext!);
                }
                if (!(branch.trueNext instanceof ir.MergeVertex)) {
                    this.verticesStack.push(branch.trueNext!);
                }
                this.verticesStack.push(branch);
                this.verticesStack.push(branch.condition!);
                break
            case ir.VertexKind.Merge:
                // TODO: support forward branches (i.e. loops)
                const merge = this.verticesStack.pop() as ir.MergeVertex;
                if (!(merge.next instanceof ir.MergeVertex)) {
                    this.verticesStack.push(merge.next!);
                }
                this.verticesStack.push(...merge.phiVertices);
                this.verticesStack.push(merge);
                break;
            case ir.VertexKind.Return:
                if ((vertex as ir.ReturnVertex).value != undefined) {
                    this.verticesStack.push((vertex as ir.ReturnVertex).value!);
                }
                break;
            default:
                throw new Error(`Unexpected vertex kind: ${vertex.kind}`);
        }
    }

    next(): IteratorResult<ir.Vertex> {
        if (this.verticesStack.length == 0) {
            return { done: true, value: undefined };
        }
        let top = this.verticesStack[this.verticesStack.length - 1];
        while (top !== undefined && (this.visited.has(top) || !this.processed.has(top))) {
            if (this.visited.has(top)) {
                this.verticesStack.pop();
            }
            else {
                this.processStackTop();
            }
            top = this.verticesStack[this.verticesStack.length - 1];
        }
        const nextVertex = this.verticesStack.pop()!;
        this.visited.add(nextVertex);
        return { done: false, value: nextVertex };
    }
}

export class CodeGenIterable implements Iterable<ir.Vertex> {
    constructor(private readonly graph: ir.Graph) { }

    [Symbol.iterator](): Iterator<ir.Vertex> {
        return new CodeGenIterator(this.graph);
    }
}

