"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, Save, Loader2, KeyRound } from "lucide-react";

const TERMINALS = ["T2", "T3", "T4", "T5"] as const;
type Terminal = (typeof TERMINALS)[number];

type PageState = {
  messages: Record<Terminal, string>;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
};

type PwForm = { currentPassword: string; newPassword: string; confirm: string };
type PwState = { saving: boolean; saved: boolean; error: string };

const emptyMessages = (): Record<Terminal, string> =>
  Object.fromEntries(TERMINALS.map((t) => [t, ""])) as Record<Terminal, string>;

export default function SettingsPage() {
  const [state, setState] = useState<PageState>({
    messages: emptyMessages(),
    loading: true,
    saving: false,
    saved: false,
    error: null,
  });

  const [pwForm, setPwForm] = useState<PwForm>({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [pwState, setPwState] = useState<PwState>({
    saving: false,
    saved: false,
    error: "",
  });

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.getTerminalMessages();
      const raw = res.data.messages ?? {};
      const messages = emptyMessages();
      TERMINALS.forEach((t) => {
        messages[t] = raw[t] ?? "";
      });
      setState((prev) => ({ ...prev, messages, loading: false, error: null }));
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load terminal messages.",
      }));
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleChange = (terminal: Terminal, value: string) => {
    setState((prev) => ({
      ...prev,
      messages: { ...prev.messages, [terminal]: value },
      saved: false,
    }));
  };

  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true, error: null, saved: false }));
    try {
      const toSave: Record<string, string> = {};
      TERMINALS.forEach((t) => {
        const v = state.messages[t].trim();
        if (v) toSave[t] = v;
      });
      await api.updateTerminalMessages(toSave);
      setState((prev) => ({ ...prev, saving: false, saved: true }));
      setTimeout(() => setState((prev) => ({ ...prev, saved: false })), 3000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: err instanceof Error ? err.message : "Save failed",
      }));
    }
  };

  const handlePwFieldChange = (field: keyof PwForm, value: string) => {
    setPwForm((prev) => ({ ...prev, [field]: value }));
    setPwState((prev) => ({ ...prev, saved: false, error: "" }));
  };

  const handlePwSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwState((prev) => ({ ...prev, error: "Passwords do not match" }));
      return;
    }
    setPwState({ saving: true, saved: false, error: "" });
    try {
      await api.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setPwState({ saving: false, saved: true, error: "" });
      setTimeout(() => setPwState((prev) => ({ ...prev, saved: false })), 3000);
    } catch (err) {
      setPwState({
        saving: false,
        saved: false,
        error: err instanceof Error ? err.message : "Failed to change password",
      });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ── Terminal Messages ── */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              Terminal Messages
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              When a customer selects a departure terminal at booking, this message is
              included in their confirmation email. Leave blank to send nothing.
            </p>
          </div>
          <button
            disabled={state.saving || state.loading}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-50 transition-all hover:opacity-90 shrink-0"
          >
            {state.saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : state.saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {state.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {state.loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TERMINALS.map((t) => (
                <div
                  key={t}
                  className="h-28 rounded-xl animate-pulse"
                  style={{ background: "var(--border)" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TERMINALS.map((terminal) => (
                <div key={terminal} className="flex flex-col gap-2">
                  <label
                    className="text-sm font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {terminal}
                  </label>
                  <textarea
                    rows={4}
                    value={state.messages[terminal]}
                    onChange={(e) => handleChange(terminal, e.target.value)}
                    placeholder={`Instructions for ${terminal} customers…`}
                    className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    style={{
                      background: "var(--muted)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="space-y-6">
        <div>
          <h2
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: "var(--foreground)" }}
          >
            <KeyRound className="w-5 h-5" />
            Change Password
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Update your admin account password. Minimum 8 characters.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {pwState.error && (
            <p className="text-sm text-red-500 mb-4">{pwState.error}</p>
          )}
          <form onSubmit={handlePwSave} className="space-y-4 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Current Password
              </label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => handlePwFieldChange("currentPassword", e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                New Password
              </label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => handlePwFieldChange("newPassword", e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => handlePwFieldChange("confirm", e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={pwState.saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white disabled:opacity-50 transition-all hover:opacity-90"
            >
              {pwState.saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : pwState.saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Password Changed
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
