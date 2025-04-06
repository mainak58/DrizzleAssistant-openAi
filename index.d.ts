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
    role: string;
    content: string;
}
