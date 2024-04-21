
import * as ir from 'graphir';

export enum LlvmPrimitiveType {
    Void = 'void',
    F32 = 'float',
    F64 = 'double',
    I1 = 'i1',
    I32 = 'i32',
    I64 = 'i64'
}

export type LlvmFunctionType = {
    result: LlvmPrimitiveType;
    parameters: Array<LlvmPrimitiveType>;
};

export type LlvmType = LlvmPrimitiveType | LlvmFunctionType;


class TypeConversionVisitor implements ir.TypeVisitor<LlvmType> {
    visitNumberType(type: ir.NumberType): LlvmType {
        return LlvmPrimitiveType.F64;
    }

    visitIntegerType(type: ir.IntegerType): LlvmType {
        switch (type.width) {
            case 1: return LlvmPrimitiveType.I1;
            case 32: return LlvmPrimitiveType.I32;
            case 64: return LlvmPrimitiveType.I64;
            default: throw new Error(`Unsupported integer width: ${type.width}`);
        }
    }

    visitFloatType(type: ir.FloatType): LlvmType {
        switch (type.width) {
            case 32: return LlvmPrimitiveType.F32;
            case 64: return LlvmPrimitiveType.F64;
        }
    }

    visitOptionType(type: ir.OptionType): LlvmType {
        throw new Error('Option types are not yet supported.');
    }

    visitFunctionType(type: ir.FunctionType): LlvmType {
        const result = type.returnType.accept(this) as LlvmPrimitiveType;
        const parameters = type.parameterTypes.map(t => t.accept(this) as LlvmPrimitiveType);
        return { result, parameters };
    }
}

const typeConversionVisitor = new TypeConversionVisitor();

export function irTypeToLlvmType(irType: ir.Type): LlvmType {
    return irType.accept(typeConversionVisitor);
}
