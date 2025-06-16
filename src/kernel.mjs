"use strict";
import SExpr from "./sexpr.mjs";

export default class Kernel
{

expr = {};
last;

register(expr)
{
    if (expr instanceof SExpr) {
        this.expr[expr.id] = expr;
        this.last = expr.id;
        this.print_last();
        return expr.id;
    }
    else if (typeof expr === 'string') {
        // console.log(expr);
        return this.register(SExpr.from(expr));
    }
}

list(show_id = false)
{
    let str = "";
    for (const id in this.expr) {
        str += `${id}:` + this.expr[id].repr(false) + "\r\n";
    }
    console.log(str);
    return str;
}

repr(id, show_id)
{
    return this.expr[id].repr(show_id);
}

print(id, show_id)
{
    console.log(this.repr(id, show_id));
}

print_last(show_id)
{
    this.print(this.last, show_id);
}

evaluate(a, b)
{
    // console.log(a, this.expr[a]);
    const res = this.expr[a].evaluate(b);
    return this.register(res);
}

apply(a, b, c)
{
    const res = this.expr[a].apply(this.expr[b], c);
    return this.register(res);
}

meta(id)
{
    return this.expr[id].meta();
}

print_meta(id)
{
    console.log(this.meta(id));
}

print_last_meta()
{
    this.print_meta(this.last);
}

}