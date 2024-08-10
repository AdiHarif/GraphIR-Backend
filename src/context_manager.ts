
import * as fs from 'fs';

import * as ir from 'graphir';

abstract class ContextManager {
    public abstract registerType(type: ir.Type): void;
    public abstract registerStaticString(id: number, value: string): void;
    public abstract dump(outFile?: fs.PathOrFileDescriptor): void;
}

export { ContextManager };
