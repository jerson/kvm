import { createServer } from "node:http";

// Disposable provider metadata and form receiver for UI/browser checks.
// Actual token verification and account/device flows are tested in cloud-api.
createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:55443");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === "/auth/providers") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        providers: [],
        oidc: [
          { key: "authentik", label: "Authentik", icon: "authentik" },
          { key: "sso", label: "SSO", icon: "http://127.0.0.1:55442/provider-logo.svg" },
        ],
      }),
    );
    return;
  }
  if (req.url === "/provider-logo.svg") {
    res.setHeader("Content-Type", "image/svg+xml");
    res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#7c3aed" d="M3 3h6v7h6V3h6v8l-6 6v4H9v-4l-6-6z"/></svg>',
    );
    return;
  }
  if (req.method === "POST" && req.url.startsWith("/auth/oidc/")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        path: req.url,
        origin: req.headers.origin,
        ...Object.fromEntries(new URLSearchParams(body)),
      }),
    );
    return;
  }
  res.writeHead(req.url === "/me" ? 401 : 404);
  res.end();
}).listen(55442, "127.0.0.1", () =>
  console.log("Disposable cloud provider fixture on http://127.0.0.1:55442"),
);
