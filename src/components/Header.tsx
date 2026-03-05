"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg"
            style={{ color: "var(--fg)" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span>SnapShot</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/" active={pathname === "/"}>
              Camera
            </NavLink>
            <NavLink href="/gallery" active={pathname === "/gallery"}>
              Gallery
            </NavLink>
          </nav>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      style={{
        backgroundColor: active ? "var(--surface)" : "transparent",
        color: active ? "var(--fg)" : "var(--muted)",
      }}
    >
      {children}
    </Link>
  );
}
