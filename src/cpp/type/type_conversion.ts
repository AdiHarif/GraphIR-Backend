
import assert from 'assert';

import * as ir from 'graphir';

import * as cppType from './type.js';
import * as cppLibType from './lib_types.js';
import * as cppCustomType from './custom_types.js';

class TypeConversionVisitor implements ir.TypeVisitor<cppType.Type> {
    visitVoidType(type: ir.VoidType): cppType.Type {
        return new cppType.VoidType();
    }

    visitUnknownType(type: ir.UnknownType): cppType.Type {
        throw new Error('Unknown types are not yet supported.');
    }

    visitUndefinedType(type: ir.UndefinedType): cppType.Type {
        return new cppCustomType.UndefinedType();
    }

    visitNumberType(type: ir.NumberType): cppType.Type {
        return new cppType.FloatType(64);
    }

    visitIntegerType(type: ir.IntegerType): cppType.Type {
        if (type.width == 1) {
            return new cppType.BooleanType();
        }
        assert(type.width == 8 || type.width == 16 || type.width == 32 || type.width == 64);
        return new cppType.IntType(type.width);
    }

    visitFloatType(type: ir.FloatType): cppType.Type {
        return new cppType.FloatType(type.width);
    }

    visitOptionType(type: ir.OptionType): cppType.Type {
        throw new Error('Option types are not yet supported.');
    }

    visitFunctionType(type: ir.FunctionType): cppType.Type {
        const result = type.returnType.accept(this);
        const parameters = type.parameterTypes.map(t => t.accept(this));
        return new cppType.FunctionType(result, parameters);
    }

    visitStaticStringType(type: ir.StaticStringType): cppType.Type {
        return new cppType.StringType();
    }

    visitDynamicStringType(type: ir.DynamicStringType): cppType.Type {
        throw new cppType.StringType();
    }

    visitStaticArrayType(type: ir.StaticArrayType): cppType.Type {
        const arrayType = new cppLibType.VectorType(type.elementType.accept(this));
        return new cppLibType.SharedPointerType(arrayType);
    }

    visitDynamicArrayType(type: ir.DynamicArrayType): cppType.Type {
        const vectorType = new cppLibType.VectorType(type.elementType.accept(this));
        return new cppLibType.SharedPointerType(vectorType);
    }

    visitUnionType(type: ir.UnionType): cppType.Type {
        const templateArgs = type.types.map(irTypeToCppType)
        return new cppCustomType.UnionType(templateArgs);
    }
}

const typeConversionVisitor = new TypeConversionVisitor();

function irTypeToCppType(type: ir.Type): cppType.Type {
    return type.accept(typeConversionVisitor);
}

export { irTypeToCppType };