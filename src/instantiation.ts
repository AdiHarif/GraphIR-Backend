
import { exec } from 'child_process';
import * as path from 'path';

import * as ir from 'graphir';

import { irTypeToCppTypeName, irTypeToMethodExtension } from './llvm_instructions/type/type_conversion.js';

export class InstantiationConfig {
    constructor(public readonly file: string, private readonly elementType: ir.Type) {}

    get methodExtension(): string {
        return irTypeToMethodExtension(this.elementType);
    }

    get cppElementTypeName(): string {
        return irTypeToCppTypeName(this.elementType);
    }
}

export function instantiateLib(config: InstantiationConfig, outputDir: string): void {
    let flags = '-Wno-return-type-c-linkage -fPIC -g'
    flags += ` -DELEM_TYPE=\"${config.cppElementTypeName}\" -DTYPE_EXT=vec_${config.methodExtension}`;

    const outputFile = `${path.basename(config.file, '.cpp')}_${config.methodExtension}.ll`;
    exec(`clang++ ${flags} -S -emit-llvm -o ${outputDir}/${outputFile} ${config.file}`);
}
