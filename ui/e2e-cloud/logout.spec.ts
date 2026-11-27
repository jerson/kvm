import { expect, test } from "@playwright/test";

const api = "http://127.0.0.1:55442";

for (const width of [1440, 390]) {
  test(`explicit provider logout stays separate from local logout at ${width}px`, async ({
    page,
  }, info) => {
    let loggedIn = true;
    let authChecksAfterLogout = 0;
    await page.setViewportSize({ width, height: 900 });
    await page.route(`${api}/me`, route => {
      if (!loggedIn) authChecksAfterLogout++;
      return route.fulfill(
        loggedIn
          ? {
              json: {
                sub: "fixture",
                email: "fixture@example.test",
                provider: "oidc:https://auth.example.test",
                oidcLogoutProvider: "Example SSO",
              },
            }
          : { status: 401 },
      );
    });
    await page.route(`${api}/devices`, route => route.fulfill({ json: { devices: [] } }));
    await page.route(`${api}/logout`, async route => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ providerLogout: true });
      loggedIn = false;
      await route.fulfill({
        json: {
          message: "Logged out",
          redirectTo: `${api}/provider-logout-fixture`,
        },
      });
    });
    await page.route(`${api}/provider-logout-fixture`, async route => {
      // Exceed the devices page's four-second background revalidation interval.
      await new Promise(resolve => setTimeout(resolve, 5500));
      await route.fulfill({
        contentType: "text/html",
        body: "<h1>Provider sign-out confirmation</h1>",
      });
    });
    await page.goto("/devices");
    await page.getByRole("button", { name: "fixture@example.test", exact: true }).click();
    await expect(page.getByRole("button", { name: "Log out", exact: true })).toBeVisible();
    const provider = page.getByRole("button", {
      name: "Log out of Example SSO",
      exact: true,
    });
    await expect(provider).toBeVisible();
    expect((await provider.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      (await page.getByRole("button", { name: "Log out", exact: true }).boundingBox())!.height,
    ).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("provider-logout-menu.png"),
      animations: "disabled",
    });
    await provider.click();
    await expect(page.getByRole("heading", { name: "Provider sign-out confirmation" })).toBeVisible(
      { timeout: 15000 },
    );
    expect(authChecksAfterLogout).toBe(0);
  });
}

test("local-only session does not expose provider-wide logout", async ({ page }) => {
  let loggedIn = true;
  await page.route(`${api}/me`, route =>
    route.fulfill(
      loggedIn ? { json: { sub: "fixture", email: "fixture@example.test" } } : { status: 401 },
    ),
  );
  await page.route(`${api}/devices`, route => route.fulfill({ json: { devices: [] } }));
  await page.route(`${api}/logout`, async route => {
    expect(route.request().postData()).toBeNull();
    loggedIn = false;
    await route.fulfill({ json: { message: "Logged out" } });
  });
  await page.goto("/devices");
  await page.getByRole("button", { name: "fixture@example.test", exact: true }).click();
  await expect(page.getByRole("button", { name: /Log out of/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("failed logout resumes background session checks", async ({ page }) => {
  let checks = 0;
  await page.route(`${api}/me`, route => {
    checks++;
    return route.fulfill({
      json: {
        sub: "fixture",
        email: "fixture@example.test",
        oidcLogoutProvider: "Example SSO",
      },
    });
  });
  await page.route(`${api}/devices`, route => route.fulfill({ json: { devices: [] } }));
  await page.route(`${api}/logout`, route => route.fulfill({ status: 503 }));
  await page.goto("/devices");
  await page.getByRole("button", { name: "fixture@example.test", exact: true }).click();
  const before = checks;
  await page.getByRole("button", { name: "Log out of Example SSO", exact: true }).click();
  await expect.poll(() => checks, { timeout: 10000 }).toBeGreaterThan(before);
  await expect(page).toHaveURL(/\/devices$/);
});
