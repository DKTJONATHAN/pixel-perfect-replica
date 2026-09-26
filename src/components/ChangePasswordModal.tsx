/**
 * Lets a signed-in user (any role) set a new password, replacing the
 * temporary one a registrar or teacher issued them at account creation.
 * No email link is needed — this updates the password on the active session.
 */
import { useState } from "react";
import { Modal, Field, TextInput, Button } from "@/components/UI";
import { getSupabase } from "@/lib/supabase";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
    setDone(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user?.email) {
        setError("Could not verify your account. Please sign in again.");
        return;
      }

      // Re-authenticate with the current password before changing it, so a
      // shared or guessed session can't silently lock the real owner out.
      const check = await sb.auth.signInWithPassword({ email: user.email, password: current });
      if (check.error) {
        setError("Your current password is incorrect.");
        return;
      }

      const { error: updateError } = await sb.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Change password"
      description="Set a new password for signing in from now on."
    >
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-success">Your password has been updated.</p>
          <Button
            className="w-full"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Done
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Current password">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                required
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            )}
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            )}
          </Field>
          <Field label="Confirm new password">
            {(id) => (
              <TextInput
                id={id}
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
