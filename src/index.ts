import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import readlinesyns from "readline-sync";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Message, Todo } from "..";
import { error } from "console";
import { ChatCompletionMessageParam } from "openai/resources/chat";

dotenv.config();
const client = new OpenAI();

async function getAllTodos() {
    const todos = db.select().from(usersTable);
    return todos;
}

async function createTodo(todo: Todo) {
    const [todoId] = await db
        .insert(usersTable)
        .values({
            todo: todo.todo,
        })
        .returning({ id: usersTable.id });
    return todoId.id;
}

async function searchTodo(t: number) {
    await db.select().from(usersTable).where(eq(usersTable.id, t));
}

async function deleteTodo(t: number) {
    await db.delete(usersTable).where(eq(usersTable.id, t));
}

const SYSTEM_PROMPT = `

    You are an AI todo assistant with start, plan, observation and output state.
    Wait for the user prompt and first plan using avilable tools.
    After planning, Take the action with appropriate tools and wait for thr observation based on action.
    Once you get the observation, Returns the AI response based on START prompt and Observation.

    You are an AI Todo assistant. You can manage tasks by adding, editing, virwing, updating and deleting. You must follow the format.

    Todo db schema:
    id: integer and primary key
    name: string,
    age: integer(),
    email: string,
    todo: string,

    Avilable Tools:
    - getAllTodos(): It returns all todos
    - creatTodo(todo): It create a new todo in the db and taks todo as a string and return the id of created todo
    - deleteTodo(id): It delete a todo by id, from the db and takes id as a number
    - searchTodo(id): It search a todo by id, from the db and takes id as a number

    Example:
    START
    {"type": "plan", "user": "add a task for shopping" }
    {"type": "plan", "user": "i will try to get more information on what user wants to shop" }
    {"type": "output", "output": "Can you tell me what you want to shop?" }
    {"type": "plan", "user": "i want to shop for myself" }
    { "type": "plan", "plan": "i will use createTodo to add a task for shopping in db" }
    {"type": "action", "function": "createTodo", "input": "Shopping for myself" }
    {"type": "observation", "observation": "5" }
    {"type": "output", "output": "Your todo has been created successfully" }
`;

const message: ChatCompletionMessageParam[] = [
    {
        role: "system",
        content: SYSTEM_PROMPT,
    },
];

const tools = {
    getAllTodos: getAllTodos,
    createTodo: createTodo,
    searchTodo: searchTodo,
    deleteTodo: deleteTodo,
};

async function main() {
    while (true) {
        const q = readlinesyns.question(">> ");
        const userMsg = {
            type: "user",
            content: q,
        };
        message.push({ role: "user", content: JSON.stringify(userMsg) });

        while (true) {
            const chat = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: message,
            });
            const result = chat.choices[0].message.content;
            if (!result) {
                throw error("Please check your result");
            }
            message.push({ role: "assistant", content: result });

            const action = JSON.parse(result);
            if (action.type === "output") {
                console.log(`🤖: ${action.output}`);
                break;
            } else if (action.type === "action") {
                const fn = tools[action.function as keyof typeof tools];
                if (!fn) throw error("Please make a function");

                const observation = await fn(action.input);
                const observationMsg = {
                    type: "observation",
                    observation: observation,
                };
                message.push({
                    role: "system",
                    content: JSON.stringify(observationMsg),
                });
            }
        }
    }
}

main();
