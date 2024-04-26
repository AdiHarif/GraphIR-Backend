
import * as ir from 'graphir';

class CodeGenIterator implements Iterator<ir.Vertex> {
    private readonly visited = new Set<ir.Vertex>();
    private readonly processed = new Set<ir.Vertex>();

    private readonly verticesStack: Array<ir.Vertex> = [];

    constructor(private readonly graph: ir.Graph) {
        this.verticesStack.push(graph.getStartVertex());
    }

    private pushPhiReachers(src: ir.BlockEndVertex) {
        const merge = src.next as ir.MergeVertex;
        for (let phiVertex of merge.phiVertices) {
            for (let operand of phiVertex.operands) {
                if (operand.srcBranch == src) {
                    this.verticesStack.push(operand.value);
                }
            }
        }
    }

    private getDataDependencies(vertex: ir.Vertex, visited: Set<ir.Vertex>): Array<ir.Vertex> {
        if (visited.has(vertex)) {
            return [];
        }
        visited.add(vertex);
        const out = [vertex];
        vertex.outEdges
            .filter(edge => edge.category == ir.EdgeCategory.Data)
            .map(edge => edge.target)
            .forEach(vertex => out.push(...this.getDataDependencies(vertex, visited)));
        return out;
    }

    private pushPhiDominators(branch: ir.BranchVertex) {
        const reachingMap = new Map<ir.Vertex, Set<ir.Vertex>>();
        const merge = branch.merge as ir.MergeVertex;

        for (let phiVertex of merge.phiVertices) {
            for (let operand of phiVertex.operands) {
                if (!reachingMap.has(operand.srcBranch)) {
                    reachingMap.set(operand.srcBranch, new Set<ir.Vertex>());
                }
                const set = reachingMap.get(operand.srcBranch)!;
                this.getDataDependencies(operand.value, new Set<ir.Vertex>())
                    .filter(vertex => !this.visited.has(vertex))
                    .forEach(vertex => set.add(vertex));
            }
        }

        const dominators = [...reachingMap.values()].reduce((prev, curr) => {
            return new Set([...prev].filter(x => curr.has(x)));
        });

        dominators.forEach(vertex => this.verticesStack.push(vertex));
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
                // this.verticesStack.push(...(vertex as ir.PhiVertex).operands.map(operand => operand.value));
                break;
            case ir.VertexKind.Start:
            case ir.VertexKind.Pass:
            case ir.VertexKind.BlockStart:
                currentTop = this.verticesStack.pop() as ir.NonTerminalControlVertex;
                this.verticesStack.push(currentTop.next!);
                this.verticesStack.push(currentTop);
                break;
            case ir.VertexKind.BlockEnd:
                currentTop = this.verticesStack.pop() as ir.NonTerminalControlVertex;
                this.verticesStack.push((vertex as ir.BlockEndVertex).next!);
                this.verticesStack.push(currentTop);
                this.pushPhiReachers(vertex as ir.BlockEndVertex);
                break;
            case ir.VertexKind.Branch:
                const branch = this.verticesStack.pop() as ir.BranchVertex;
                this.verticesStack.push(branch.merge!);
                this.verticesStack.push(branch.falseNext!);
                this.verticesStack.push(branch.trueNext!);
                this.verticesStack.push(branch);
                this.verticesStack.push(branch.condition!);
                this.pushPhiDominators(branch);
                break
            case ir.VertexKind.Merge:
                const merge = this.verticesStack.pop() as ir.MergeVertex;
                if (!this.processed.has(merge.branch!)) {
                    this.verticesStack.push(merge.next!);
                    this.verticesStack.push(...merge.phiVertices);
                    this.verticesStack.push(merge);
                    break;
                }
                const predecessors = merge.inEdges
                    .filter(edge => edge.category == ir.EdgeCategory.Control)
                    .map(edge => edge.source);
                if (!predecessors.some(pred => !this.processed.has(pred))) { // all predecessors are processed
                    this.verticesStack.push(merge.next!);
                    this.verticesStack.push(...merge.phiVertices);
                    this.verticesStack.push(merge);
                    break;
                }
                this.processed.delete(merge);
                break;
            case ir.VertexKind.Return:
                if ((vertex as ir.ReturnVertex).value != undefined) {
                    this.verticesStack.push((vertex as ir.ReturnVertex).value!);
                }
                break;
            case ir.VertexKind.Call:
                const call = vertex as ir.CallVertex;
                this.verticesStack.push(call.next!);
                this.verticesStack.push(...call.args!);
                if (call.callerObject) {
                    this.verticesStack.push(call.callerObject);
                }
                break;
            case ir.VertexKind.Allocation:
                const allocation = this.verticesStack.pop() as ir.AllocationVertex;
                this.verticesStack.push(allocation.next!);
                this.verticesStack.push(allocation);
                //TODO: add handling of allocation with constructor arguments
                break;
            case ir.VertexKind.Load:
                const load = this.verticesStack.pop() as ir.LoadVertex;
                this.verticesStack.push(load.next!);
                this.verticesStack.push(load);
                this.verticesStack.push(load.property!);
                this.verticesStack.push(load.object!);
                break;
            case ir.VertexKind.Store:
                const store = this.verticesStack.pop() as ir.StoreVertex;
                this.verticesStack.push(store.next!);
                this.verticesStack.push(store);
                this.verticesStack.push(store.value!);
                this.verticesStack.push(store.property!);
                this.verticesStack.push(store.object!);
                break;
            default:
                throw new Error(`Unexpected vertex kind: ${vertex.kind}`);
        }
        let y = 2;

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
        if (top === undefined) {
            return { done: true, value: undefined };
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

