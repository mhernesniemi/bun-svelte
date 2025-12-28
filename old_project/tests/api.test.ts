import { describe, expect, it, beforeEach } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, comments } from "../src/db/schema";

const api = treaty<typeof app>(app);

describe("API Tests", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await db.delete(comments);
    await db.delete(users);
  });

  describe("POST /api/register", () => {
    it("should register a new user", async () => {
      const { data, error } = await api.api.register.post({
        username: "testuser",
        password: "password123",
      });

      expect(error).toBeNull();
      expect(data?.success).toBe(true);
      expect(data?.user?.username).toBe("testuser");
    });

    it("should reject duplicate username", async () => {
      // First registration
      await api.api.register.post({
        username: "testuser",
        password: "password123",
      });

      // Second registration with same username
      const { data, error } = await api.api.register.post({
        username: "testuser",
        password: "password456",
      });

      expect(error).not.toBeNull();
    });

    it("should validate minimum username length", async () => {
      const { data, error } = await api.api.register.post({
        username: "ab", // Too short (min 3)
        password: "password123",
      });

      expect(error).not.toBeNull();
    });

    it("should validate minimum password length", async () => {
      const { data, error } = await api.api.register.post({
        username: "testuser",
        password: "12345", // Too short (min 6)
      });

      expect(error).not.toBeNull();
    });
  });

  describe("POST /api/login", () => {
    beforeEach(async () => {
      // Create a test user first
      await api.api.register.post({
        username: "testuser",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const { data, error } = await api.api.login.post({
        username: "testuser",
        password: "password123",
      });

      expect(error).toBeNull();
      expect(data?.success).toBe(true);
      expect(data?.user?.username).toBe("testuser");
    });

    it("should reject invalid credentials", async () => {
      const { data, error } = await api.api.login.post({
        username: "testuser",
        password: "wrongpassword",
      });

      expect(error).not.toBeNull();
    });
  });

  describe("POST /api/logout", () => {
    it("should logout successfully", async () => {
      const { data, error } = await api.api.logout.post();

      expect(error).toBeNull();
      expect(data?.success).toBe(true);
    });
  });

  describe("GET /api/me", () => {
    it("should return 401 when not authenticated", async () => {
      const { data, error } = await api.api.me.get();

      expect(error).not.toBeNull();
    });
  });

  describe("GET /api/comments", () => {
    it("should return 401 when not authenticated", async () => {
      const { data, error } = await api.api.comments.get();

      expect(error).not.toBeNull();
    });
  });

  describe("POST /api/comments", () => {
    it("should return 401 when not authenticated", async () => {
      const { data, error } = await api.api.comments.post({
        title: "Test Title",
        content: "Test Content",
      });

      expect(error).not.toBeNull();
    });
  });

  describe("DELETE /api/comments/:id", () => {
    it("should return 401 when not authenticated", async () => {
      const { data, error } = await api.api.comments({ id: 1 }).delete();

      expect(error).not.toBeNull();
    });
  });
});
