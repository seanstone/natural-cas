"use strict";
import Assistant from "./assistant.mjs";
import Toolbox from "./cas-toolbox.mjs";

export default class CASAssistant extends Assistant
{
    constructor(model)
    {
        super(model);
        this.toolbox = new Toolbox();
        this.prompt(`Only give answers by manipulating expressions with the given function tools to applying identities and evaluate subexpressions.
All arguments to the functions should be ids of expressions given by calling list(), or ids of subexpressions given by calling meta(id).

For example, if we want to simplify an expression A,
we can call list() first to get all the available expressions:

0:{{{x^m}/{x^n}}={x^{m+{-n}}}}
14:{A={1+{{5^23}/{5^21}}}}

Now we want to apply 0:{{{x^m}/{x^n}}={x^{m+{-n}}}} to the {{5^23}/{5^21}}} subexpression of 14:{A={1+{{5^23}/{5^21}}}}.
So we call first call neta to get the subexpression ids of expression 14.

meta(14) gives
{"id":14,"value":["=",{"id":15,"value":"A"},{"id":16,"value":["+",{"id":17,"value":1},{"id":18,"value":["/",{"id":19,"value":["^",{"id":20,"value":5},{"id":21,"value":23}]},{"id":22,"value":["^",{"id":23,"value":5},{"id":24,"value":21}]}]}]}]}
so we know the subexpression has id 18 from the result of calling meta.

Then we can call
apply(14, 0, 18)
and we are given an id 25 for the result.
We can call list() to see the result, which is
25:{A={1+{5^{23+-21}}}}

To proceed, we can then call meta(53), which gives
{"id":25,"value":["=",{"id":36,"value":"A"},{"id":37,"value":["+",{"id":46,"value":1},{"id":47,"value":["^",{"id":48,"value":5},{"id":49,"value":["+",{"id":50,"value":23},{"id":51,"value":["-",{"id":52,"value":21}]}]}]}]}]
We can call evaluate(25, 51) for the subexpression 51, to turn -{21} to -21.

We can then call the functions to further simplify the result.

(End of example)
`);
    }
};