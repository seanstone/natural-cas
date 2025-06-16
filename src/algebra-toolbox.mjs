"use strict";

export default class CASToolbox
{

tools = [
    {
        type: 'function',
        function: {
            name: 'add',
            description: 'add({a, b}) = a+b: Adds two numbers and returns the result.',
            parameters: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'The first number.',
                    },
                    b: {
                        type: 'number',
                        description: 'The second number.',
                    },
                },
                required: ['a', 'b'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'multiply',
            description: 'multiply({a, b}) = a*b: Multiply two numbers and returns the result.',
            parameters: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'The first number.',
                    },
                    b: {
                        type: 'number',
                        description: 'The second number.',
                    },
                },
                required: ['a', 'b'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'divide',
            description: 'divide({a, b}) = a/b: Divide two numbers and returns the result.',
            parameters: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'The first number.',
                    },
                    b: {
                        type: 'number',
                        description: 'The second number.',
                    },
                },
                required: ['a', 'b'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'power',
            description: 'power({a, b}) = a^b: Calculate power of a to b and returns the result.',
            parameters: {
                type: 'object',
                properties: {
                    a: {
                        type: 'number',
                        description: 'The first number.',
                    },
                    b: {
                        type: 'number',
                        description: 'The second number.',
                    },
                },
                required: ['a', 'b'],
            },
        },
    },
];

add({ a, b }) {
    return a + b;
}

multiply({ a, b }) {
    return a * b;
}

divide({ a, b }) {
    return a / b;
}

power({ a, b }) {
    return Math.pow(a, b);
}

};