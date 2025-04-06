export interface Todo {
    id: number;
    name: string;
    age: number;
    email: string;
    todo: string;
}

interface OutputAction {
    type: string;
    output: string;
}

export interface Message {
    role: "system" | "user" | "assistant" | "function";
    content: string;
    name?: string;
}

export type ToolKeys = keyof typeof tools;
export type Action = {
    function: ToolKeys;
};
