import { AppShell } from "@/components/app-shell";
import { candidateNav } from "@/lib/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={candidateNav}>
      {children}
    </AppShell>
  );
}
