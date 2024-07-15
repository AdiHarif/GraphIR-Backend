
import fs from 'fs';
import assert from 'assert';

import * as ir from 'graphir';

import { LlvmStructType, LlvmFunctionType, LlvmType, LlvmPointerType, LlvmVoidType, LlvmIntegerType } from './llvm_instructions/type/type.js';
import { irTypeToLlvmType, irTypeToMethodExtension } from './llvm_instructions/type/type_conversion.js';
import { getSizeType, getVectorType } from './llvm_instructions/type/predefind_type.js';
import { InstantiationConfig } from './instantiation.js';

export class ContextManager {
    private typeDeclarations: Map<string, LlvmType> = new Map();
    private functionDeclarations: Map<string, LlvmFunctionType> = new Map();
    private staticStrings: Map<number, string> = new Map();
    public readonly instantiations: Array<InstantiationConfig> = [];

    constructor() {
        this.typeDeclarations.set(getSizeType().name, new LlvmIntegerType(64));
        this.registerMathFunctions();
        this.registerConsoleFunctions();
    }

    private registerVectorFunctions(type: ir.DynamicArrayType): void {
        const methodExtension = irTypeToMethodExtension(type);
        const elementType = irTypeToLlvmType(type.elementType);
        this.functionDeclarations.set(
            `create_vector_${methodExtension}`,
            new LlvmFunctionType(
                new LlvmPointerType(),
                [])
        );

        this.functionDeclarations.set(
            `create_sized_vector_${methodExtension}`,
            new LlvmFunctionType(
                new LlvmPointerType(),
                [getSizeType()]
            )
        );

        this.functionDeclarations.set(
            `push_back_${methodExtension}`,
            new LlvmFunctionType(
                new LlvmVoidType(),
                [new LlvmPointerType(), elementType]
            )
        );

        this.functionDeclarations.set(
            `get_${methodExtension}`,
            new LlvmFunctionType(
                elementType,
                [new LlvmPointerType(), getSizeType()]
            )
        );

        this.functionDeclarations.set(
            `set_${methodExtension}`,
            new LlvmFunctionType(
                new LlvmVoidType(),
                [new LlvmPointerType(), getSizeType(), elementType]
            )
        );

        this.functionDeclarations.set(
            `size_${methodExtension}`,
            new LlvmFunctionType(
                getSizeType(),
                [new LlvmPointerType()]
            )
        );
    }

    private registerMathFunctions(): void {
        this.functionDeclarations.set(
            'Math_floor',
            new LlvmFunctionType(
                new LlvmIntegerType(64),
                [new LlvmIntegerType(64)]
            )
        );
    }

    private registerConsoleFunctions(): void {
        this.functionDeclarations.set(
            'console_log',
            new LlvmFunctionType(
                new LlvmVoidType(),
                [new LlvmPointerType()]
            )
        );
    }

    private registerInstantiation(lib: string, elementType: ir.Type): void {
        const instantiation = new InstantiationConfig(lib, elementType);
        if (this.instantiations.some(i => i.methodExtension === instantiation.methodExtension)) {
            return;
        }
        this.instantiations.push(new InstantiationConfig(lib, elementType));
    }

    public registerType(type: ir.Type): void {
        assert(type instanceof ir.StaticArrayType || type instanceof ir.DynamicArrayType);
        if (type instanceof ir.StaticArrayType) {
            return;
        }

        this.typeDeclarations.set(
            getVectorType().name,
            new LlvmStructType([new LlvmPointerType(), new LlvmPointerType(), new LlvmPointerType()])
        );

        this.registerVectorFunctions(type);
        this.registerInstantiation('templates/vector.cpp', type.elementType);
    }

    public registerStaticString(index: number, value: string): void {
        this.staticStrings.set(index, value);
    }

    public dump(outFile?: fs.PathOrFileDescriptor): void {
        let dumpFunctions;
        if (outFile) {
            dumpFunctions = (s: string) => fs.appendFileSync(outFile, s + '\n');
        }
        else {
            dumpFunctions = console.log;
        }

        for (const [name, type] of this.typeDeclarations) {
            dumpFunctions(`${name} = type ${type.name}`);
        }
        dumpFunctions('');
        for (const [name, type] of this.functionDeclarations) {
            dumpFunctions(`declare ${type.result.name} @${name}(${type.parameters.map(p => p.name).join(', ')})`);
        }
        dumpFunctions('');
        for (const [index, value] of this.staticStrings) {
            dumpFunctions(`@.s${index} = private unnamed_addr constant [${value.length + 1} x i8] c"${value}\\00"`);
        }
    }
}
