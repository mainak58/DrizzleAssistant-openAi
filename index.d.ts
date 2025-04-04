export interface Todo {
    id: number;
    name: string;
    age: number;
    email: string;
    todo: string;
}
export interface Message {
    role: string;
    content: string;
}

interface OutputAction {
    type: string;
    output: string;
}
