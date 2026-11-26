import { useEffect, useState } from "react";
import { LinkIcon } from "@heroicons/react/24/outline";
import { CLOUD_API, CLOUD_AUTH_PROVIDERS } from "@/ui.config";
import { Button } from "@components/Button";
import { GoogleIcon } from "@components/Icons";

interface Provider {
  key: string;
  label: string;
  icon?: string;
}
interface Providers {
  providers: string[];
  oidc: Provider[];
}

export function useAuthProviders() {
  const [config, setConfig] = useState<Providers>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    void (async () => {
      try {
        const response = await fetch(`${CLOUD_API}/auth/providers`, { signal: controller.signal });
        if (response.status === 404) {
          // Older cloud APIs expose their provider list through UI configuration.
          setConfig({ providers: CLOUD_AUTH_PROVIDERS, oidc: [] });
          return;
        }
        if (!response.ok) throw new Error("Could not load sign-in providers");
        const data = await response.json();
        if (!Array.isArray(data.providers) || !Array.isArray(data.oidc))
          throw new Error("Invalid sign-in providers");
        setConfig(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => controller.abort();
  }, [retry]);
  return { config, error, retry: () => setRetry(value => value + 1) };
}

function ProviderIcon({ provider }: { provider: Provider }) {
  const icon = provider.icon || provider.key;
  const source =
    icon === "authentik"
      ? "/oidc-icons/authentik.svg"
      : /^(\/oidc-icons\/|https?:\/\/|data:image\/)/.test(icon)
        ? icon
        : undefined;
  const [failed, setFailed] = useState<string>();
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 ring-1 ring-black/5"
    >
      {source && failed !== source ? (
        <img
          src={source}
          alt=""
          width={22}
          height={22}
          className="size-[22px] object-contain"
          referrerPolicy="no-referrer"
          onError={() => setFailed(source)}
        />
      ) : icon === "google" ? (
        <GoogleIcon className="size-[22px]" />
      ) : (
        <LinkIcon className="size-5" />
      )}
    </span>
  );
}

export function OIDCSignIn({
  providers,
  deviceId,
  returnTo,
  mode,
}: {
  providers: Provider[];
  deviceId?: string;
  returnTo?: string;
  mode: "login" | "signup";
}) {
  const [busy, setBusy] = useState<string>();
  useEffect(() => {
    const reset = () => setBusy(undefined);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  // A native cross-origin form POST carries the browser's Origin and follows
  // the authorization redirect without needing token or secret access in JS.
  return providers.map(provider => (
    <form
      key={provider.key}
      action={`${CLOUD_API}/auth/oidc/${encodeURIComponent(provider.key)}/start`}
      method="POST"
      onSubmit={() => setBusy(provider.key)}
    >
      {deviceId ? <input type="hidden" name="deviceId" value={deviceId} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <Button
        type="submit"
        size="LG"
        theme="light"
        fullWidth
        className="h-auto! min-h-12 py-2"
        data-testid={`oidc-sign-in-${provider.key}`}
        disabled={!!busy}
        loading={busy === provider.key}
        text={
          <>
            <ProviderIcon provider={provider} />
            <span className="min-w-0 flex-1 text-left text-sm wrap-anywhere">
              {mode === "signup" ? "Continue" : "Sign in"} with {provider.label}
            </span>
          </>
        }
      />
    </form>
  ));
}
