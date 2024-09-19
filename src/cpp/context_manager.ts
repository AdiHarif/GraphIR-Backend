
import * as fs from "fs";

import * as ir from "graphir";

import { ContextManager } from "../context_manager.js";

class CppContextManager extends ContextManager {
    private stdLibIncludes: Set<string> = new Set();
    private externalIncludes: Set<string> = new Set();

    private static supportedExternalLibs = [
        'console',
        'Math'
    ];

    public registerType(type: ir.Type): void {
        if (type instanceof ir.StaticArrayType || type instanceof ir.DynamicArrayType) {
            this.stdLibIncludes.add("memory");
        }
        if (type instanceof ir.DynamicArrayType) {
            this.externalIncludes.add("DynamicArray");
        }
        if (type instanceof ir.FunctionType) {
            this.stdLibIncludes.add("functional");
        }

        if (type instanceof ir.UnionType) {
            this.externalIncludes.add("union");
        }
    }

    public registerStaticString(id: number, value: string): void {}

    public registerSymbol(vertex: ir.StaticSymbolVertex): void {
        if (CppContextManager.supportedExternalLibs.includes(vertex.name)) {
            this.externalIncludes.add(vertex.name);
        }
    }

    public dump(outFile?: fs.PathOrFileDescriptor): void {
        let dumpFunction;
        if (outFile) {
            dumpFunction = (s: string) => fs.appendFileSync(outFile, s + '\n');
        }
        else {
            dumpFunction = console.log;
        }
        dumpFunction('');

        for (const libInclude of this.stdLibIncludes) {
            dumpFunction(`#include <${libInclude}>`);
        }
        dumpFunction('');

        for (const externalInclude of this.externalIncludes) {
            dumpFunction(`#include "${externalInclude}.h"`);
        }
        dumpFunction('');
    }
}

export { CppContextManager };
