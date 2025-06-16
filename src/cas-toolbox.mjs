"use strict";
import Kernel from "./kernel.mjs";

export default class CASToolbox
{

tools =  [
    {
        type: 'function',
        function: {
            name: 'list',
            description: 'List all expressions and identities.',
            parameters: {
                type: 'object',
                properties: {
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'meta',
            description: `Print the expression in full detail, along with the ids of its subexpressions.
            Every subexpression is given by {id: ... ...}.
            `,
            parameters: {
                type: 'object',
                properties: {
                    a: { type: 'string', description: 'id of the expression' },
                },
                required: ['a'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'apply',
            description: `Apply an identity on a subexpression within an expression.
            To use this function, first obtain the ids by calling list and meta, and pass in the ids.
            Returns the result expression id.`,
            parameters: {
                type: 'object',
                properties: {
                    a: { type: 'string', description: 'id of the expression' },
                    b: { type: 'string', description: 'id of the identity' },
                    c: { type: 'string', description: 'id of the subexpression' },
                },
                required: ['a', 'b', 'c'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'evaluate',
            description: `Evaluate a subexpression within an expression.
            To use this function, first obtain the ids by calling list and meta, and pass in the ids.
            Eligible subexpressions on which this function can be called are
            a+b+...+c, a*b*...*c, a^b, a/b, -{a}.  Returns the result expression id.
            `,
            parameters: {
                type: 'object',
                properties: {
                    a: { type: 'string', description: 'id of the expression' },
                    b: { type: 'string', description: 'id of the subexpression' },
                },
                required: ['a', 'b'],
            },
        },
    },
];

kernel;

constructor()
{
    this.kernel = new Kernel();
    this.kernel.register("{x^m}/{x^n}=x^{m-n}");
    this.kernel.register("A=1+5^{23}/5^{21}");
}

list(args)
{
    return this.kernel.list(args);
}

apply(args)
{
    return this.kernel.apply(args.a, args.b, args.c);
}

evaluate(args)
{
    return this.kernel.evaluate(args.a, args.b);
}

meta(args)
{
    return this.kernel.meta(args.a);
}

};