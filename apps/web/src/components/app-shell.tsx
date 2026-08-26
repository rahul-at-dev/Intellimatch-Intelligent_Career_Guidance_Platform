"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import * as Icons from "lucide-react";
import clsx from "clsx";

type NavGroup = { section: string; items: { href: string; label: string; icon: string }[] };

export function AppShell({
  nav,
  children,
}: {
  nav: NavGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  return (
    <div className="flex min-h-screen bg-[#fafaff]">
      {/* Sidebar Navigation - clean white sidebar with subtle border */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200/90 bg-white px-4 py-6 lg:flex shadow-sm z-10">
        {/* Brand Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white font-extrabold shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            I
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight text-base">
              IntelliMatch
            </span>
            <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider -mt-0.5">
              Career AI
            </span>
          </div>
        </Link>

        {/* Nav Groups */}
        <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon =
                    (Icons as unknown as Record<string, React.ElementType>)[item.icon] ?? Icons.Circle;
                  const active = Boolean(pathname && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                        active
                          ? "bg-gradient-to-r from-brand-50 via-indigo-50/60 to-transparent text-brand-700 font-bold border-l-2 border-brand-600 shadow-sm shadow-brand-500/5"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        size={16}
                        className={active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Identity Footer */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2.5 shadow-sm">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="min-w-0 flex-1">
            {isLoaded && user ? (
              <>
                <p className="truncate text-xs font-bold text-slate-800">
                  {user.fullName ?? user.firstName ?? "Rahul I"}
                </p>
                <p className="truncate text-[10px] text-slate-500 font-medium">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Authenticating...</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area with Subtle Atmospheric Background Glows */}
      <main className="relative flex-1 px-6 py-8 lg:px-10 overflow-x-hidden min-h-screen">
        {/* Subtle Ambient Decorative Glows behind content */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          {/* Top-left soft lavender/purple glow */}
          <div className="absolute -top-32 left-64 h-[420px] w-[420px] rounded-full bg-brand-200/18 blur-3xl" />
          {/* Bottom-right soft pale blue/lavender glow */}
          <div className="absolute -bottom-24 -right-16 h-[500px] w-[500px] rounded-full bg-sky-100/25 blur-3xl" />
          {/* Center-right very soft violet hint */}
          <div className="absolute top-1/2 right-1/3 h-80 w-80 rounded-full bg-indigo-100/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
