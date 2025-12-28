import { useNavigate } from "@tanstack/react-router";
import { Login } from "@/components/Login";
import { Heading } from "@/components/ui/heading";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background via-background to-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Heading level={1}>Comments</Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <Login
          onSuccess={() => navigate({ to: "/dashboard" })}
          onSwitchToRegister={() => navigate({ to: "/register" })}
        />
      </div>
    </div>
  );
}
