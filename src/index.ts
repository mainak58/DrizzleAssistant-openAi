import { eq } from "drizzle-orm";
import { Todo } from "..";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

async function getAllTodos() {
    const todos = db.select().from(usersTable);
    return todos;
}

async function createTodo(todo: Todo) {
    await db.insert(usersTable).values({
        name: todo.name,
        age: todo.age,
        email: todo.email,
        todo: todo.todo,
    });
}

async function searchTodo(t: number) {
    await db.select().from(usersTable).where(eq(usersTable.id, t));
}

async function deleteTodo(t: number) {
    await db.delete(usersTable).where(eq(usersTable.id, t));
}

async function generate() {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        maxOutputTokens: 50,
        apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await model.invoke([
        [
            "system",
            "You are a helpful assistant that translates English to French. Translate the user sentence.",
        ],
        ["human", "I love programming."],
    ]);

    console.log(response.content);
}

generate();
