"use strict";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { v4 as uuidv4 } from 'uuid';

const ce = new ComputeEngine();

export default class SExpr
{

id;
value;

map_head(head)
{
    switch (head)
    {
        case 'Add': return '+';
        case 'Negate': return '-';
        case 'Multiply': return '*';
        case 'Power': return '^';
        case 'Divide': return '/';
        case 'Equal': return '=';
    }
    return head;
}

static from(expr)
{
    // Construct from latex string
    if (typeof expr === 'string') {
        let mathjson = ce.parse(expr, { canonical: false }).json;
        // console.log(mathjson);
        return new SExpr(mathjson);
    }
}

new_id()
{
    if (SExpr.use_uuid) return uuidv4();

    const id = SExpr.next_id.toString();
    SExpr.next_id++;
    return id;
}

constructor(expr)
{
    this.id = this.new_id();

    // Construct from string
    if (typeof expr === 'string') {
        this.value = expr;
    }
    // Construct from number
    else if (typeof expr === 'number') {
        this.value = expr;
    }
    // Construct from mathjson / SExpr value
    else if (Array.isArray(expr)) {
        this.value = [this.map_head(expr[0])];
        for (let i = 1; i < expr.length; i++) this.value[i] = new SExpr(expr[i]);
    }
    // Construct from SExpr
    else if (expr instanceof SExpr) {
        if (Array.isArray(expr.value)) {
            this.value = [expr.value[0]];
            for (let i = 1; i < expr.value.length; i++) this.value[i] = new SExpr(expr.value[i]);
        }
        else this.value = expr.value;
    }

    // console.log(this.id, expr);
}

repr(show_id = false)
{
    let res = "";

    if (typeof this.value === 'string') {
        res = this.value;
    }
    else if (typeof this.value === 'number') {
        res = `${this.value}`;
    }
    else if (Array.isArray(this.value)) {
        const head = this.value[0];
        switch (head)
        {
            case '+':
            case '*': {
                let str = "";
                for (let i = 1; i < this.value.length; i++) {
                    if (i != 1) str += head;
                    str += this.value[i].repr(show_id);
                }
                res = str;
                break;
            }
            case '-': {
                res = `-${this.value[1].repr(show_id)}`;
                break;
            }
            case '/':
            case '^':
            case '=': {
                res = `${this.value[1].repr(show_id)}${head}${this.value[2].repr(show_id)}`;
                break;
            }
            case 'Delimiter': {
                res = `(${this.value[1].repr(show_id)})`;
                break;
            }
            default:
                console.error(`Unhandled head: ${this.value[0]}`, this);
        }
    }

    if (show_id) res = `{${this.id}:${res}}`;
    else if (Array.isArray(this.value)) res = `{${res}}`;

    return res;
}

expr_map(r)
{
    // console.log("expr_map: ", this.repr(), ", ", r.repr());

    let map = {};
    if (typeof this.value === 'string' && (typeof r.value === 'string' || typeof r.value === 'number')) {
        map[this.value] = r.value;
        return map;
    }
    else if (typeof this.value === 'number' && typeof r.value === 'number') {
        if (this.value == r.value) return map;
    }
    else if (Array.isArray(this.value) && Array.isArray(r.value)) {
        if (this.value[0] == r.value[0] && this.value.length == r.value.length) {
            for (let i = 1; i < this.value.length; i++) {
                const submap = this.value[i].expr_map(r.value[i]);
                for (const k in submap) {
                    if (k in map) {
                        if (submap[k] != map[k]) return null;
                    }
                    else {
                        map[k] = submap[k];
                    }
                }
            }
            return map;
        }
    }

    return null;
}

apply_map(m)
{
    if (!m) return new SExpr(this);

    if (typeof this.value === 'string') {
        if (this.value in m) return new SExpr(m[this.value]);
    }
    else if (typeof this.value === 'number') {
        return new SExpr(this.value);
    }
    else if (Array.isArray(this.value)) {
        let mapped = new SExpr([this.value[0]]);
        for (let i = 1; i < this.value.length; i++) mapped.value[i] = this.value[i].apply_map(m);
        return mapped;
    }
}

apply(identity, id)
{
    /* Parse identity */
    if (identity.value[0] != "=") {
        console.error("Not identity!");
        return;
    }
    const l = identity.value[1];
    const r = identity.value[2];
    // console.log(l.repr(), r.repr());

    if (!id || id == this.id)
    {
        /* Generate identity map */
        const m = l.expr_map(this);
        // console.log(m);

        /* Apply identity map */
        return r.apply_map(m);
    }
    else if (Array.isArray(this.value)) {
        let res = new SExpr(this);
        res.value = [this.value[0]];
        for (let i = 1; i < this.value.length; i++) res.value[i] = this.value[i].apply(identity, id);
        return res;
    }
    return new SExpr(this);
}

evaluate(id)
{
    if (!id || id == this.id)
    {
        // console.log(this.id);
        if (Array.isArray(this.value)) {
            const head = this.value[0];
            switch (head)
            {
                case '+': {
                    let res = 0;
                    for (let i = 1; i < this.value.length; i++) {
                        if (!(typeof this.value[i].value === 'number')) return new SExpr(this);
                        res += this.value[i].value;
                    }
                    return new SExpr(res);
                }
                case '*': {
                    let res = 1;
                    for (let i = 1; i < this.value.length; i++) {
                        if (!(typeof this.value[i].value === 'number')) return new SExpr(this);
                        res *= this.value[i].value;
                    }
                    return new SExpr(res);
                }
                case '-': {
                    if (typeof this.value[1].value === 'number')
                        return new SExpr(-this.value[1].value);
                }
                case '/': {
                    if (typeof this.value[1].value === 'number' && typeof this.value[2].value === 'number')
                        return new SExpr(this.value[1].value / this.value[2].value);
                }
                case '^': {
                    if (typeof this.value[1].value === 'number' && typeof this.value[2].value === 'number')
                        return new SExpr(Math.pow(this.value[1].value, this.value[2].value));
                }
            }
        }
    }
    else if (Array.isArray(this.value)) {
        let res = new SExpr(this);
        res.value = [this.value[0]];
        for (let i = 1; i < this.value.length; i++) res.value[i] = this.value[i].evaluate(id);
        return res;
    }
    return new SExpr(this);
}

meta()
{
    return JSON.stringify(this);
}
    
}

SExpr.use_uuid = false;
SExpr.next_id = 0;