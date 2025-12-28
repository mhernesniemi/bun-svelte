import { useNavigate } from "@tanstack/react-router";
import { Register } from "@/components/Register";
import { Heading } from "@/components/ui/heading";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background via-background to-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Heading level={1}>Comments</Heading>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to continue
          </p>
        </div>
        <Register
          onSuccess={() => navigate({ to: "/dashboard" })}
          onSwitchToLogin={() => navigate({ to: "/login" })}
        />
      </div>
    </div>
  );
}
