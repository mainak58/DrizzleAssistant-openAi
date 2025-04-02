import { eq } from "drizzle-orm";
import { Todo } from "..";
import { db } from "../db";
import { usersTable } from "../db/schema";

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
