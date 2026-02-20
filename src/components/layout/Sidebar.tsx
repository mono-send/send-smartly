import { cn } from "@/lib/utils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Workflow,
  UserCircle,
  ChevronsUpDown,
  HelpCircle,
  ArrowUpCircle,
  Info,
  LogOut,
} from "lucide-react";
import logo from '/favicon-48x48.png';
import logo2 from '/logo.png';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Automations", href: "/automations", icon: Workflow },
  // { name: "Broadcasts", href: "/broadcasts", icon: Megaphone },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Audience", href: "/audience", icon: Users },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Senders", href: "/senders", icon: UserCircle },
  { name: "Logs", href: "/logs", icon: ScrollText },
  { name: "API Keys", href: "/api-keys", icon: Key },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
  // { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6 min-h-16">
          <img src={logo} alt="MonoSend" className="h-8 object-contain" />
          <img src={logo2} alt="MonoSend" className="h-8 object-contain" />
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-in-out hover:gap-4",
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

        {/* Footer with Popover */}
        <div className="border-t border-border p-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-56 p-2">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
              <Separator className="my-1" />
              <button
                onClick={() => navigate("/settings")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <a
                href="https://docs.monosend.io/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Get help
              </a>
              <Separator className="my-1" />
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade plan
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Info className="h-4 w-4" />
                Learn more
              </button>
              <Separator className="my-1" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </aside>
  );
}
