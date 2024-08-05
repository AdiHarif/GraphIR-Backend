
import * as fs from "fs";

import * as ir from "graphir";

import { ContextManager } from "../context_manager.js";

class CppContextManager extends ContextManager {
    private libIncludes: Set<string> = new Set();

    public registerType(type: ir.Type): void {
        if (type instanceof ir.StaticArrayType || type instanceof ir.DynamicArrayType) {
            this.libIncludes.add("memory");
        }
        if (type instanceof ir.DynamicArrayType) {
            this.libIncludes.add("vector");
        }
        if (type instanceof ir.FunctionType) {
            this.libIncludes.add("functional");
        }
    }

    public registerStaticString(id: number, value: string): void {}

    public dump(outFile?: fs.PathOrFileDescriptor): void {
        let dumpFunction;
        if (outFile) {
            dumpFunction = (s: string) => fs.appendFileSync(outFile, s + '\n');
        }
        else {
            dumpFunction = console.log;
        }
        dumpFunction('');

        for (const libInclude of this.libIncludes) {
            dumpFunction(`#include <${libInclude}>`);
        }
        dumpFunction('');
    }
}

export { CppContextManager };
