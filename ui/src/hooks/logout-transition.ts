import { create } from "zustand";

// UI coordination only; the cloud server revokes and validates every session.
// Keep background loaders from competing with the provider's document redirect.
export const useLogoutTransition = create<{
  pending: boolean;
  setPending: (pending: boolean) => void;
}>(set => ({ pending: false, setPending: pending => set({ pending }) }));
