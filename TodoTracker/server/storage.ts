import { users, todos, type User, type InsertUser, type Todo, type InsertTodo, type UpdateTodo } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  

  getAllTodos(): Promise<Todo[]>;
  getTodo(id: number): Promise<Todo | undefined>;
  createTodo(todo: InsertTodo): Promise<Todo>;
  updateTodo(id: number, updates: UpdateTodo): Promise<Todo | undefined>;
  deleteTodo(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllTodos(): Promise<Todo[]> {
    return await db.select().from(todos).orderBy(desc(todos.createdAt));
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    return todo || undefined;
  }

  async createTodo(insertTodo: InsertTodo): Promise<Todo> {
    const [todo] = await db
      .insert(todos)
      .values(insertTodo)
      .returning();
    return todo;
  }

  async updateTodo(id: number, updates: UpdateTodo): Promise<Todo | undefined> {
    const [todo] = await db
      .update(todos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning();
    return todo || undefined;
  }

  async deleteTodo(id: number): Promise<boolean> {
    const result = await db.delete(todos).where(eq(todos.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
