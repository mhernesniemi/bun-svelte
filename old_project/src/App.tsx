import { useState, useEffect } from "react";
import { Comments } from "@/components/Comments";
import { Login } from "@/components/Login";
import { Register } from "@/components/Register";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Heading } from "@/components/ui/heading";
import "./index.css";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.api.me.get();
      if (response.data && !response.error) {
        const user = (response.data as { user: { username: string } }).user;
        setUsername(user.username);
        setIsAuthenticated(true);
      }
    } catch (err) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    checkAuth();
  };

  const handleLogout = async () => {
    try {
      await api.api.logout.post();
    } catch (err) {
      // Ignore errors
    }
    setIsAuthenticated(false);
    setUsername("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background via-background to-muted/30 px-4">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background via-background to-muted/30 px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Heading level={1}>Comments</Heading>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </div>
          {showRegister ? (
            <Register
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <Login
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-background via-background to-muted/30 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Heading level={1} className="text-2xl sm:text-3xl">
              Comments
            </Heading>
            <p className="mt-1 text-sm text-muted-foreground">
              You are signed in. Post a comment or browse the latest ones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border bg-card/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur supports-backdrop-filter:bg-card/40">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              <span className="max-w-56 truncate">{username}</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
        <Comments />
      </div>
    </div>
  );
}

export default App;
