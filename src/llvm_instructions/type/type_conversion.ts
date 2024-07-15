
import * as ir from 'graphir';

import {
    LlvmType,
    LlvmIntegerType,
    LlvmFloatType,
    LlvmFunctionType,
    LlvmArrayType,
    LlvmVoidType,
    LlvmPointerType,
} from './type.js';

import { getVectorType } from './predefind_type.js';

class TypeConversionVisitor implements ir.TypeVisitor<LlvmType> {
    visitVoidType(type: ir.VoidType): LlvmType {
        return new LlvmVoidType();
    }

    visitUnknownType(type: ir.UnknownType): LlvmType {
        throw new Error('Unknown types are not yet supported.');
    }

    visitNumberType(type: ir.NumberType): LlvmType {
        return new LlvmIntegerType(64);
    }

    visitIntegerType(type: ir.IntegerType): LlvmType {
        return new LlvmIntegerType(type.width);
    }

    visitFloatType(type: ir.FloatType): LlvmType {
        return new LlvmFloatType(type.width);
    }

    visitOptionType(type: ir.OptionType): LlvmType {
        throw new Error('Option types are not yet supported.');
    }

    visitFunctionType(type: ir.FunctionType): LlvmType {
        const result = type.returnType.accept(this);
        const parameters = type.parameterTypes.map(t => t.accept(this));
        return new LlvmFunctionType(result, parameters);
    }

    visitStaticStringType(type: ir.StaticStringType): LlvmType {
        return new LlvmPointerType();
    }

    visitDynamicStringType(type: ir.DynamicStringType): LlvmType {
        throw new Error('Dynamic string types are not yet supported.');
    }

    visitStaticArrayType(type: ir.StaticArrayType): LlvmType {
        return new LlvmArrayType(type.elementType.accept(this), type.length);
    }

    visitDynamicArrayType(type: ir.DynamicArrayType): LlvmType {
        return new LlvmPointerType();
    }
}

const typeConversionVisitor = new TypeConversionVisitor();

export function irTypeToLlvmType(irType: ir.Type): LlvmType {
    return irType.accept(typeConversionVisitor);
}

export function irTypeToMethodExtension(irType: ir.Type): string {
    if (irType instanceof ir.IntegerType) {
        return `i${irType.width}`;
    }
    else if (irType instanceof ir.DynamicArrayType) {
        return `vec_${irTypeToMethodExtension(irType.elementType)}`;
    }
    else {
        return irTypeToLlvmType(irType).name;
    }
}

export function irTypeToCppTypeName(irType: ir.Type): string {
    if (irType instanceof ir.IntegerType) {
        return `int${irType.width}_t`;
    }
    else if (irType instanceof ir.FloatType) {
        return `double`;
    }
    else if (irType instanceof ir.DynamicArrayType) {
        return `vector<${irTypeToCppTypeName(irType.elementType)}>*`;
    }
    else {
        throw new Error('Unsupported type');
    }
}
