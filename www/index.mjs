"use strict";

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

function extract_timestring(name)
{
    // Regex to extract the final date and time before ".json"
    const regex = /_(\d{4}-\d{2}-\d{2})_(\d{2}:\d{2}:\d{2})$/;

    const match = name.match(regex);

    if (match) {
        const [ , date, time ] = match;
        return `${date} ${time}`;
    } else {
        // console.log("No valid date/time found in name.");
    }

    return null;
}

class Client
{

models = {};
chats = {};
active_chat = null;

constructor()
{
    this.init_input();
    this.load_models();
    this.load_chats();
    this.init_ws();
}

append_message(message)
{
    if (message.role == "user") {
        if (message.content) {
            const temp = document.createElement('div');
            temp.innerHTML = `<div class="chat chat-end">
                <div class="chat-bubble bg-green-300 hover:bg-green-400 hover:cursor-pointer text-black">
                    ${message.content.replaceAll("\n", "<br>")}
                </div>
            </div>`
            document.getElementById("chat").appendChild(temp.firstElementChild);
        }
    }
    else if (message.role == "tool") {
        if (message.content) {
            const temp = document.createElement('div');
            temp.innerHTML = `<div class="chat chat-end">
                <div class="chat-bubble bg-amber-100 hover:bg-amber-200 hover:cursor-pointer">
                    <div class="text-sm uppercase font-semibold text-gray-500">Tool result</div>
                    <div class="text-blue-800 font-mono">${message.content}</div>
                </div>
            </div>`
            document.getElementById("chat").appendChild(temp.firstElementChild);
        }
    }
    else if (message.role == "assistant") {
        if (message.content) {
            const temp = document.createElement('div');
            temp.innerHTML = `<div class="chat chat-start">
                <div class="chat-bubble bg-neutral-200 hover:bg-neutral-300 hover:cursor-pointer text-black">
                    ${message.content.replaceAll("\n", "<br>")}
                </div>
            </div>`
            document.getElementById("chat").appendChild(temp.firstElementChild);
        }
        if (message.tool_calls) {
            for (const tool_call of message.tool_calls) {
                const temp = document.createElement('div');
                temp.innerHTML = `<div class="chat chat-start">
                    <div class="chat-bubble bg-orange-200 hover:bg-orange-300 hover:cursor-pointer">
                        <div class="text-sm uppercase font-semibold text-gray-500">Tool call</div>
                        <div class="text-blue-800 font-mono">${tool_call.function.name}(${tool_call.function.arguments})</div>
                    </div>
                </div>`
                document.getElementById("chat").appendChild(temp.firstElementChild);
            }
        }
    }
}

select_chat(name)
{
    // console.log(chat);
    this.active_chat = name;

    for (const child of document.getElementById("chats").children) {
        if (child.chat_name == name) {
            child.classList.add("bg-slate-700");
            child.classList.remove("hover:bg-gray-800");
        }
        else {
            child.classList.remove("bg-slate-700");
            child.classList.add("hover:bg-gray-800");
        }
    }

    document.getElementById("chat").innerHTML = "";

    if (name) {
        const chat = this.chats[name];
        document.getElementById('model').value = chat.model;
        for (const message of chat.messages) this.append_message(message);
    }
}

async load_models()
{
    this.models = await(await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    })).json();

    document.getElementById("model").innerHTML = "";
    for (const model in this.models) {
        document.getElementById("model").innerHTML += `<option>${model}</option>`;
    }

    return this.models;
}

async load_chats()
{
    const data = await(await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    })).json();

    document.getElementById("chats").innerHTML = "";

    // console.log(data);

    for (const name in data) this.add_chat(data[name]);

    return this.chats;
}

add_chat(chat)
{
    // console.log(chat);

    const timestring = extract_timestring(chat.name);
    const title = chat.title ?? (chat.messages[1] ? chat.messages[1].content : "");

    this.chats[chat.name] = chat;

    const temp = document.createElement('div');
    temp.innerHTML = `<li class="list-row hover:bg-gray-800 hover:cursor-pointer">
        <div class="list-col-grow">${title}</div>
        <div class="text-right">
            <div class="badge bg-cyan-600">${chat.model}</div>
            <div class="text-gray-400 pr-1">${timestring}</div>
        </div>
    </li>`;
    temp.firstElementChild.chat_name = chat.name;
    temp.firstElementChild.onclick = () => this.select_chat(chat.name);
    document.getElementById("chats").prepend(temp.firstElementChild);
}

init_input()
{
    document.getElementById('new').onclick = () => this.select_chat(null);

    document.getElementById('submit').onclick = () => this.submit();

    document.getElementById('input').addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            if (event.shiftKey) return; // Allow new line
            else {
                event.preventDefault();
                this.submit();
            }
        }
    });
}

async submit()
{
    const input = document.getElementById('input');
    const message = input.value.trim();
    if (message == "") return;
    console.log("Submit:", message);
    input.value = ""; // Clear input

    if (!this.active_chat) {
        const model = document.getElementById('model').value;
        this.active_chat = `${model}_${getFormattedTimestamp()}`;
        console.log(`New chat: ${this.active_chat}`);
        this.add_chat({
            title: message,
            model: model,
            messages: [],
            name: this.active_chat,
        });
    }

    const res = await(await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: this.active_chat,
            model: this.chats[this.active_chat].model,
            message: message,
        }),
    })).json();
}

init_ws()
{
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;  // includes hostname and port if any
    const pathname = '/ws';  // adjust to your WebSocket path on the server

    const wsUrl = `${protocol}//${host}${pathname}`;

    const ws = new WebSocket(wsUrl);

    // When the connection is open
    ws.addEventListener('open', () => {
        console.log('Connected to the WebSocket server');
    });

    // When a message is received from the server
    ws.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        console.log(data, this.chats, this.chats[data.name]);
        this.chats[data.name].messages.push(data.message);
        if (data.name = this.active_chat) this.append_message(data.message);
    });

    // When the connection is closed
    ws.addEventListener('close', () => {
        console.log('Disconnected from WebSocket server');
    });

    // When an error occurs
    ws.addEventListener('error', error => {
        console.error('WebSocket error:', error);
    });
}

}

const client = new Client();