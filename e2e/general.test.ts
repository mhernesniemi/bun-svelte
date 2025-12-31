import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should register a new user", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("text=Register")).toBeVisible();
    await expect(page.locator("text=Create a new account")).toBeVisible();

    await page.fill('input[name="username"]', "testuser");
    await page.fill('input[name="password"]', "testpassword123");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should login with existing user", async ({ page }) => {
    const username = `testuser-${Date.now()}`;
    const password = "testpassword123";

    await page.goto("/register");
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.goto("/logout");
    await page.waitForURL(/\/login/);

    await page.goto("/login");
    await expect(page.locator("text=Login")).toBeVisible();

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator(`text=${username}`)).toBeVisible();
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="username"]', "nonexistent");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/invalid/i")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate between login and register pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Login")).toBeVisible();

    await page.click('a[href*="/register"]');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("text=Register")).toBeVisible();

    await page.click('a[href*="/login"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Login")).toBeVisible();
  });
});

test.describe("Dashboard Flow", () => {
  test("should access dashboard after login", async ({ page }) => {
    const username = `testuser-${Date.now()}`;
    const password = "testpassword123";

    await page.goto("/register");
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Colleague Feedback")).toBeVisible();
    await expect(page.locator(`text=${username}`)).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    const username = `testuser-${Date.now()}`;
    const password = "testpassword123";

    await page.goto("/register");
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);

    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Login")).toBeVisible();
  });

  test("should redirect to login when accessing dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
