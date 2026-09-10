import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ai_news_aggregator_user_prefs",
      JSON.stringify({ sources: [] }),
    );
  });
});

test("loads the app and opens source settings", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /AI News Aggregator/i }),
  ).toBeVisible();

  const chooseSources = page.getByRole("button", { name: "Choose sources" });
  await expect(chooseSources).toBeVisible();
  await chooseSources.click();

  const dialog = page.getByRole("dialog", {
    name: "AI News Aggregator setup",
  });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Close source settings" }).click();
  await expect(dialog).toBeHidden();
});
