
export enum LlvmPrimitiveType {
    Void = 'void',
    F64 = 'double',
    I1 = 'i1',
    I64 = 'i64'
}

export type LlvmFunctionType = {
    result: LlvmPrimitiveType;
    parameters: Array<LlvmPrimitiveType>;
};

export type LlvmType = LlvmPrimitiveType | LlvmFunctionType;
