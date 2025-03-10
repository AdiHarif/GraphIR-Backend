

import * as ir from 'graphir'

import { irTypeToCppType } from './type/type_conversion.js';
import { VarDecl, StructDecl } from './ast/decl.js';
import { UserDefinedType } from './type/custom_types.js';

export function generateGlobalsStruct(fields: Array<[string, ir.Type]>): string {
    const fieldDeclerations = fields.map(f => {
        const name = f[0]
        const type = irTypeToCppType(f[1])
        return new VarDecl(type, name);
    });
    let out = new StructDecl('Globals', fieldDeclerations).toString() + '\n';
    out += new VarDecl(new UserDefinedType('Globals'), '_globals').toString() + '\n';
    return out
}
