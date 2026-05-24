const toBoolean = (value: string | undefined) => {
  if (!value) return false;
  return ["1", "true", "yes", "y"].includes(value.toLowerCase().trim());
};

declare global {
  interface Window {
    __JETKVM_RUNTIME_CONFIG__?: {
      CLOUD_API?: string;
      CLOUD_AUTH_PROVIDERS?: string;
    };
  }
}

const runtimeConfig = window.__JETKVM_RUNTIME_CONFIG__ || {};

export const CLOUD_API = runtimeConfig.CLOUD_API || import.meta.env.VITE_CLOUD_API;
export const CLOUD_AUTH_PROVIDERS = (
  runtimeConfig.CLOUD_AUTH_PROVIDERS || import.meta.env.VITE_CLOUD_AUTH_PROVIDERS || "google"
)
  .split(",")
  .map((provider: string) => provider.trim().toLowerCase())
  .filter(Boolean);

export const CLOUD_BACKWARDS_COMPATIBLE_VERSION =
  import.meta.env.VITE_CLOUD_BACKWARDS_COMPATIBLE_VERSION || "0.5.0";

export const CLOUD_ENABLE_VERSIONED_UI = toBoolean(import.meta.env.VITE_CLOUD_ENABLE_VERSIONED_UI);

export const DOWNGRADE_VERSION = import.meta.env.VITE_DOWNGRADE_VERSION || "0.4.8";

// In device mode, an empty string uses the current hostname (the JetKVM device's IP) as the API endpoint
export const DEVICE_API = "";
