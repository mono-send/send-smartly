import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import {
  Mail,
  Megaphone,
  FileText,
  Users,
  BarChart3,
  Globe,
  ScrollText,
  Key,
  Webhook,
  Settings,
  Send,
} from "lucide-react";
import logo from '/favicon-48x48.png';
import logo2 from '/logo.png';

const navigation = [
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Broadcasts", href: "/broadcasts", icon: Megaphone },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Audience", href: "/audience", icon: Users },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "API Keys", href: "/api-keys", icon: Key },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Send className="h-4 w-4 text-primary-foreground" />
          </div>
          <img
            src={logo}
            alt="MonoSend"
            className="h-8 object-contain"
          />
          <img
            src={logo2}
            alt="MonoSend"
            className="h-8 object-contain"
          />
          {/* <span className="text-lg font-semibold text-foreground">MonoSend</span> */}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "font-medium bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              U
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-foreground">User</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
