import Link from "next/link";
import Avatar from "./Avatar";
import NavLink from "./NavLink";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/lib/actions";

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm text-accent-fg">
            <span aria-hidden>📣</span>
          </span>
          <span className="text-[17px] font-bold tracking-tight">
            Shqipot
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <NavLink href="/">Feed</NavLink>
          <NavLink href="/insights">Priorities</NavLink>
          <NavLink href="/representatives">Represent</NavLink>
        </nav>

        {user ? (
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <Avatar handle={user.handle} size={28} />
              <span className="hidden text-sm font-medium sm:inline">
                @{user.handle}
              </span>
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-secondary btn-sm">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="nav-link">
              Sign in
            </Link>
            <Link href="/login" className="btn-primary btn-sm">
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
