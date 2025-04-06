import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import readlinesyns from "readline-sync";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Todo } from "..";

dotenv.config();

async function getAllTodos() {
    const todos = db.select().from(usersTable);
    return todos;
}

async function createTodo(todo: Todo) {
    const [todoId] = await db
        .insert(usersTable)
        .values({
            name: todo.name,
            age: todo.age,
            email: todo.email,
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

const tools = {
    getAllTodos: getAllTodos,
    createTodo: createTodo,
    searchTodo: searchTodo,
    deleteTodo: deleteTodo,
};

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

// const messages = [
//     {
//         role: "system",
//         content: SYSTEM_PROMPT,
//     },
//     {
//         role: "user",
//         content: "you are an helpful assistant",
//     },
// ];

const client = new OpenAI();

async function main() {
    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: "Write a one-sentence bedtime story about a unicorn.",
            },
        ],
        max_tokens: 30,
    });

    console.log(completion.choices[0].message.content);
}

main();
