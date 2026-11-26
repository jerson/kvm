import { expect, test } from "@playwright/test";

const api = "http://127.0.0.1:55442";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="orange"/></svg>';
const svgData = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const pngData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pAAAAABJRU5ErkJggg==";

for (const dark of [false, true]) {
  for (const width of [1440, 390]) {
    test(`provider icons, fallback, and layout at ${width}px ${dark ? "dark" : "light"}`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.addInitScript(
        theme => localStorage.setItem("theme", theme),
        dark ? "dark" : "light",
      );
      await page.route(`${api}/auth/providers`, route =>
        route.fulfill({
          json: {
            providers: [],
            oidc: [
              { key: "authentik", label: "Authentik", icon: "authentik" },
              { key: "sso", label: "SSO", icon: `${api}/provider-logo.svg` },
              { key: "inline", label: "Inline SVG", icon: svgData },
              { key: "png", label: "Inline PNG", icon: pngData },
              { key: "local", label: "Local icon", icon: "/oidc-icons/test.svg" },
              { key: "missing", label: "Missing icon", icon: "/oidc-icons/missing.svg" },
              { key: "google", label: "Google", icon: "google" },
              { key: "generic", label: "Generic" },
            ],
          },
        }),
      );
      await page.route("**/oidc-icons/test.svg", route =>
        route.fulfill({ contentType: "image/svg+xml", body: svg }),
      );
      await page.route("**/oidc-icons/missing.svg", route =>
        route.fulfill({ status: 404, body: "missing" }),
      );
      await page.goto("/login");
      await expect(
        page.getByRole("button", { name: "Sign in with SSO", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("textbox")).toHaveCount(0);
      const buttons = page.locator('[data-testid^="oidc-sign-in-"]');
      await expect(buttons).toHaveCount(8);
      for (const key of ["authentik", "sso", "inline", "png", "local"]) {
        const img = page.getByTestId(`oidc-sign-in-${key}`).locator("img");
        await expect(img).toHaveCount(1);
        await expect
          .poll(() => img.evaluate(node => (node as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
      }
      await expect(page.getByTestId("oidc-sign-in-missing").locator("img")).toHaveCount(0);
      for (const key of ["missing", "generic", "google"]) {
        await expect(page.getByTestId(`oidc-sign-in-${key}`).locator("svg")).toHaveCount(1);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      for (const button of await buttons.all())
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      await page.getByTestId("oidc-sign-in-authentik").focus();
      await expect(page.getByTestId("oidc-sign-in-authentik")).toBeFocused();
      // macOS WebKit uses Option+Tab to include non-text form controls.
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(page.getByTestId("oidc-sign-in-sso")).toBeFocused();
    });
  }
}

test("submits provider key and device adoption fields using a native form", async ({ page }) => {
  const returnTo = "http://192.0.2.10/adopt";
  await page.goto(`/signup?${new URLSearchParams({ deviceId: "test-device", returnTo })}`);
  const responsePromise = page.waitForResponse(`${api}/auth/oidc/sso/start`);
  await page.getByRole("button", { name: "Continue with SSO", exact: true }).click();
  const response = await responsePromise;
  expect(await response.json()).toEqual({
    path: "/auth/oidc/sso/start",
    origin: "http://127.0.0.1:55443",
    deviceId: "test-device",
    returnTo,
  });
});

test("captures the configured provider login screen", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await expect(page.getByTestId("oidc-sign-in-sso")).toBeVisible();
  await expect(page.locator("#skeleton")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("login-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.getByTestId("oidc-sign-in-sso")).toBeVisible();
  await expect(page.locator("#skeleton")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("login-mobile-dark.png") });
});

test("loads OIDC-only, legacy API fallback, and retry after metadata failure", async ({ page }) => {
  await page.route(`${api}/auth/providers`, route =>
    route.fulfill({
      json: {
        providers: [],
        oidc: [{ key: "sso", label: "SSO", icon: "generic" }],
      },
    }),
  );
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in with SSO", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await page.unroute(`${api}/auth/providers`);
  await page.route(`${api}/auth/providers`, route => route.fulfill({ status: 404 }));
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Sign in with Google", exact: true }),
  ).toBeVisible();
  await page.unroute(`${api}/auth/providers`);
  await page.route(`${api}/auth/providers`, route => route.fulfill({ status: 503 }));
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Could not load sign-in options");
  await page.unroute(`${api}/auth/providers`);
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign in with SSO", exact: true })).toBeVisible();
});
