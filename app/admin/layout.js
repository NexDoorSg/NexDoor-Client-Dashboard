"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    label: "Client Onboarding",
    href: "/admin/client-onboarding",
  },
  {
    label: "Seller Case Management",
    href: "/admin/seller-cases",
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#36454f]">
      <div className="flex min-h-screen">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed left-0 top-0 z-40 h-screen w-72 border-r border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-transform duration-300 lg:static lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-black/5 px-6 py-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
                NexDoor Internal
              </p>
              <h2 className="mt-2 text-2xl font-bold">Admin Menu</h2>
              <p className="mt-2 text-sm text-[#5f6b73]">
                Manage client onboarding and seller case tracking.
              </p>
            </div>

            <nav className="flex-1 space-y-2 p-4">
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  pathname === "/admin"
                    ? "bg-[#36454f] text-white"
                    : "bg-[#faf9f7] text-[#36454f] hover:bg-[#f1eeea]"
                }`}
              >
                Admin Home
              </Link>

              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#36454f] text-white"
                        : "bg-[#faf9f7] text-[#36454f] hover:bg-[#f1eeea]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f5f2]/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-4 md:px-6">
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm lg:hidden"
                aria-label="Toggle admin menu"
              >
                <div className="space-y-1.5">
                  <span className="block h-0.5 w-5 bg-[#36454f]" />
                  <span className="block h-0.5 w-5 bg-[#36454f]" />
                  <span className="block h-0.5 w-5 bg-[#36454f]" />
                </div>
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
                  NexDoor
                </p>
                <p className="text-lg font-bold text-[#36454f]">Admin Dashboard</p>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
