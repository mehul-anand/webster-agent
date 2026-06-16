import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function Auth() {
  async function login(provider: "github" | "google") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    });

    if (error) {
      alert("Error while signing in");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-4">
      <Button variant="outline" size="lg" onClick={() => login("google")}>
        Login with Google
      </Button>
      <Button variant="outline" size="lg" onClick={() => login("github")}>
        Login with GitHub
      </Button>
    </div>
  );
}
