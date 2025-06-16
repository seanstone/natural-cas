"use strict";
import { promises as fs } from 'fs';
import path from 'path';
import { access, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import Auth from '../auth.json' with { type: 'json' };
import Models from '../models.json' with { type: 'json' };

async function ensureParentDirs(filePath)
{
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
}

function getFormattedTimestamp()
{
    const now = new Date();
    
    const pad = (n) => String(n).padStart(2, '0');

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1); // Months are 0-indexed
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
}

export default class Assistant
{
    name;
    model;
    messages = [];
    toolbox;
    #llm;
    on_message = (name, message) => {};

    static chats = {};

    constructor(model)
    {
        this.model = model;
        this.name = `${model}_${getFormattedTimestamp()}`;
        const provider = Models.providers[Models.models[this.model].provider];
        const apiKey = process.env[provider.apiKey_env] ?? Auth[provider.apiKey_env];
        if (!apiKey) console.error(`Failed to get ${provider.apiKey_env}`);
        this.#llm = new OpenAI({ apiKey: apiKey, baseURL: provider.baseURL });
    }

    prompt(content)
    {
        this.messages.push(
            { role: 'system', content: content }
        );
    }

    new_message(message)
    {
        this.messages.push(message);

        if (message.content) console.log(`[${message.role}] ${message.content}`);

        if (message.tool_calls) {
            for (const tool_call of message.tool_calls) console.log(`[${message.role}] call \"${tool_call.function.name}\" with ${tool_call.function.arguments}`);
        }

        this.on_message(this.name, message);
    }

    async chat(input)
    {
        const model = Models.models[this.model];
        const provider = Models.providers[model.provider];
        const model_prefix = provider.model_prefix ?? "";
        const prefix = model.prefix ?? "";

        if (typeof input === 'string') this.new_message(
            { role: "user", content: prefix + input },
        )
        else if (Array.isArray(input)) {
            for (const message of input) this.new_message(message);
        }

        const response = await this.#llm.chat.completions.create({
            model: model_prefix + this.model,
            messages: this.messages,
            tools: this.toolbox.tools,
        });
        const response_message = response.choices ? response.choices[0].message : response.message;
        this.new_message(response_message);

        /* Check for tool calls */
        let tool_call_results = [];
        let tool_calls;
        if (response_message.tool_calls) tool_calls = response_message.tool_calls;
        if (tool_calls) {
            for (const tool_call of tool_calls) {
                for (const tool of this.toolbox.tools) {
                    if (tool.function.name == tool_call.function.name)
                    {
                        const args = typeof tool_call.function.arguments === 'string' ? JSON.parse(tool_call.function.arguments) : tool_call.function.arguments;
                        const result = this.toolbox[tool_call.function.name](args);
                        
                        tool_call_results.push({
                            role: "tool",
                            tool_call_id: tool_call.id,
                            content: result.toString(),
                        });
                        break;
                    }
                }
            }
        }
        /* Send the result back to the model */
        if (tool_call_results.length) await this.chat(tool_call_results);

        // console.dir(this.messages, {depth: null});
    }

    data()
    {
        return {
            name: this.name,
            model: this.model,
            messages: this.messages,
        };
    }

    async save()
    {
        const outputPath = `logs/${this.model}_${getFormattedTimestamp()}.json`;
        await ensureParentDirs(outputPath);
        await fs.writeFile(outputPath, JSON.stringify(this.data(), null, 4));
    }

    static async load(directory)
    {
        try {
            const files = await readdir(directory);
            
            const jsonFiles = files.filter(filename => filename.endsWith('.json'));

            for (const filename of jsonFiles) {
                const filePath = join(directory, filename);
                const data = await readFile(filePath, 'utf-8');
                const parsed = JSON.parse(data);
                const name = filename.replace(/\.json$/, "");
                const assistant = Assistant.chats[name] = new Assistant(parsed.model);
                assistant.name = name;
                assistant.messages = parsed.messages;
            }
        } catch (err) {
            // console.error('Load error');
        }
    }
};