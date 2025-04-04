import { eq } from "drizzle-orm";
import { Action, Message, Todo } from "..";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import readlinesyns from "readline-sync";

import dotenv from "dotenv";

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

const messages: Message[] = [
    {
        role: "system",
        content: SYSTEM_PROMPT,
    },
];

// async function main() {
//     while (true) {
//         const query = readlinesyns.question(">> ");
//         const userMessage = {
//             type: "user",
//             user: query,
//         };
//         messages.push({ role: "user", content: JSON.stringify(userMessage) });

//         while (true) {
//             const model = new ChatGoogleGenerativeAI({
//                 model: "gemini-2.0-flash",
//                 maxOutputTokens: 50,
//                 apiKey: process.env.GEMINI_API_KEY,
//             });
//             const response = await model.invoke(messages);

//             const result = response.content;
//             messages.push({ role: "assistant", content: result });

//             try {
//                 const action = JSON.parse(result) as Action;
//                 if (action.type === "output") {
//                     console.log(`bot: ${action.output}`);
//                     break;
//                 } else if (action.type === "think") {
//                     console.log(`[thinking]: ${action.thought}`);
//                     // Continue the loop to get the final output after thinking
//                 } else {
//                     console.log("Received unknown action type. Retrying...");
//                     // Remove the last message to retry
//                     messages.pop();
//                     break;
//                 }
//             } catch (error) {
//                 console.error("Failed to parse response as JSON:", error);
//                 console.log("Raw response:", result);
//                 // Remove the last message to retry
//                 messages.pop();
//                 break;
//             }
//         }
//     }
// }

async function main() {
    while (true) {
        const query = readlinesyns.question(">> ");

        if (query.toLowerCase() === "exit" || query.toLowerCase() === "quit") {
            console.log("Goodbye!");
            break;
        }

        const userMessage = {
            type: "user",
            user: query,
        };

        messages.push({ role: "user", content: JSON.stringify(userMessage) });

        while (true) {
            try {
                const model = new ChatGoogleGenerativeAI({
                    model: "gemini-2.0-flash",
                    maxOutputTokens: 50,
                    apiKey: process.env.GEMINI_API_KEY,
                });

                const langChainMessages = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

                const response = await model.invoke(langChainMessages);

                let resultText = "";
                if (typeof response.content === "string") {
                    resultText = response.content;
                } else if (Array.isArray(response.content)) {
                    resultText = response.content
                        .map((item) => {
                            if (typeof item === "string") return item;
                            if (item.type === "text") return item.text;
                            return "";
                        })
                        .join("");
                }

                messages.push({ role: "assistant", content: resultText });

                try {
                    const action = JSON.parse(resultText) as Action;

                    if (action.type === "output") {
                        console.log(`bot: ${action.output}`);
                        break;
                    } else if (action.type === "action") {
                        const fn = tools?.[action.input]
                        const observation = fn(action.input);
                        const observationMsg = {
                            type: "observation",
                            observation: observation,
                        };

                        messages.push({
                            role: "developer",
                            content: JSON.stringify(observationMsg),
                        });
                    } else {
                        console.log(
                            "Received unknown action type. Retrying..."
                        );
                        messages.pop();
                        break;
                    }
                } catch (parseError) {
                    console.error(
                        "Failed to parse response as JSON:",
                        parseError
                    );
                    console.log("Raw response:", resultText);
                    messages.pop();
                    break;
                }
            } catch (apiError) {
                console.error("API error:", apiError);
                break;
            }
        }
    }
}
main();
