import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-7 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Join the board</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Pick a username you can return to, or stay completely anonymous with a
          generated ID. No email, no phone number.
        </p>
      </div>
      <div className="card p-6">
        <LoginForm />
      </div>
    </div>
  );
}
