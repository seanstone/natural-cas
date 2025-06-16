"use strict";
import Assistant from "./assistant.mjs";
import Toolbox from "./algebra-toolbox.mjs";

export default class AlgebraAssistant extends Assistant
{
    constructor(model)
    {
        super(model);
        this.toolbox = new Toolbox();
        this.prompt(`When given a math expression, calculate the result only using the given function tools.
Always pass as arguments the exact number obtained from the initial expression or the result of function calls (do not truncate, approximate).
Reply with the answer only.
If the input is not a valid math expression or cannot be calculated by the given tools, return an error description.
`);
    }
};