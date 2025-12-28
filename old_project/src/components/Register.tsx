import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RegisterProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

function getErrorMessage(value: unknown, fallback: string) {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const maybeError = (value as { error?: unknown }).error;
    if (typeof maybeError === "string") return maybeError;
  }
  return fallback;
}

export function Register({ onSuccess, onSwitchToLogin }: RegisterProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const defaultErrorMessage = "Registration failed. Please try again.";

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const { data, error: apiError } = await api.api.register.post({
        username,
        password,
      });

      if (apiError) {
        setError(getErrorMessage(apiError.value, defaultErrorMessage));
        return;
      }

      if (data && "error" in data && data.error) {
        setError(
          getErrorMessage(
            (data as { error?: unknown }).error,
            defaultErrorMessage
          )
        );
      } else if (data && "success" in data && data.success) {
        queryClient.removeQueries({ queryKey: ["comments"] });
        onSuccess();
      } else {
        setError(defaultErrorMessage);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : defaultErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border-0 bg-card/50 shadow-xl ring-1 ring-border/30 backdrop-blur supports-backdrop-filter:bg-card/40">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create a new account to access comments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="register-username">Username</Label>
            <Input
              id="register-username"
              placeholder="At least 3 characters"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">Confirm password</Label>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              type="button"
              onClick={onSwitchToLogin}
              variant="link"
              className="h-auto p-0 align-baseline"
            >
              Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
