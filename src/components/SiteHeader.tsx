import Link from "next/link";
import Avatar from "./Avatar";
import NavLink from "./NavLink";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/lib/actions";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 pr-1">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-base text-accent-fg shadow-sm">
              <span aria-hidden>📣</span>
            </span>
            <span className="text-base font-semibold tracking-tight">
              Shqipot
            </span>
          </Link>
          <nav className="flex items-center gap-0.5">
            <NavLink href="/insights">Priorities</NavLink>
            <NavLink href="/representatives">Represent</NavLink>
          </nav>
        </div>

        {user ? (
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-2">
              <Avatar handle={user.handle} size={28} />
              <span className="hidden text-sm font-medium text-muted sm:inline">
                @{user.handle}
              </span>
              {!user.protected ? (
                <span className="hidden rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted sm:inline">
                  anon
                </span>
              ) : null}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-secondary btn-sm">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary btn-sm">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
