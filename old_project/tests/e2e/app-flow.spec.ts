import { test, expect } from "@playwright/test";

test("e2e: register, post comment, logout, login, see comment", async ({
  page,
}) => {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const username = `e2e_${nonce}`;
  const password = "testpass123!";
  const title = `E2E title ${nonce}`;
  const content = `E2E content ${nonce}`;

  await page.goto("/register");
  await page.fill("#register-username", username);
  await page.fill("#register-password", password);
  await page.fill("#register-confirm-password", password);
  
  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/register") && response.request().method() === "POST"
  );
  
  await page.getByRole("button", { name: "Register" }).click();
  
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  await page.fill("#comment-title", title);
  await page.fill("#comment-content", content);
  
  const commentResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/comments") && response.request().method() === "POST"
  );
  
  await page.getByRole("button", { name: "Post" }).click();
  
  await commentResponsePromise;
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText(content, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#login-username")).toBeVisible();
  await expect(page.locator("#login-password")).toBeVisible();

  await page.fill("#login-username", username);
  await page.fill("#login-password", password);
  
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/login") && response.request().method() === "POST"
  );
  
  await page.getByRole("button", { name: "Login" }).click();
  
  await loginResponsePromise;
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

