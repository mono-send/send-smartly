import { TopBar } from "@/components/layout/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Megaphone, CreditCard, Users2, Server, Link2, ArrowUpRight, MoreHorizontal, Clock, Send, X, AlertTriangle, LogIn, UserPlus, UserMinus, Shield, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  avatar: string;
}

const initialTeamMembers: TeamMember[] = [
  { id: "1", name: "You", email: "user@example.com", role: "owner", avatar: "U" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "admin", avatar: "J" },
  { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "editor", avatar: "M" },
];

interface PendingInvitation {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  sentAt: Date;
  expiresAt: Date;
}

// Helper to create dates relative to now
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);

const initialPendingInvitations: PendingInvitation[] = [
  { id: "inv1", email: "sarah@example.com", role: "editor", sentAt: hoursAgo(2), expiresAt: daysFromNow(7) },
  { id: "inv2", email: "tom@example.com", role: "viewer", sentAt: hoursAgo(24), expiresAt: daysFromNow(6) },
  { id: "inv3", email: "expiring@example.com", role: "admin", sentAt: hoursAgo(168), expiresAt: hoursFromNow(12) },
];

// Invitation expiry duration in days
const INVITATION_EXPIRY_DAYS = 7;

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

const getExpiryStatus = (expiresAt: Date): { label: string; isExpired: boolean; isExpiringSoon: boolean } => {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return { label: "Expired", isExpired: true, isExpiringSoon: false };
  }
  if (diffHours < 24) {
    return { label: `Expires in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`, isExpired: false, isExpiringSoon: true };
  }
  return { label: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, isExpired: false, isExpiringSoon: false };
};

interface ActivityLogEntry {
  id: string;
  type: "login" | "role_change" | "invitation_sent" | "invitation_accepted" | "member_removed";
  actor: string;
  target?: string;
  details?: string;
  timestamp: Date;
}

const mockActivityLog: ActivityLogEntry[] = [
  { id: "act1", type: "login", actor: "You", timestamp: hoursAgo(0.5) },
  { id: "act2", type: "invitation_sent", actor: "You", target: "sarah@example.com", details: "Editor", timestamp: hoursAgo(2) },
  { id: "act3", type: "role_change", actor: "You", target: "Jane Smith", details: "Editor → Admin", timestamp: hoursAgo(5) },
  { id: "act4", type: "invitation_accepted", actor: "Mike Johnson", timestamp: hoursAgo(24) },
  { id: "act5", type: "login", actor: "Jane Smith", timestamp: hoursAgo(26) },
  { id: "act6", type: "member_removed", actor: "You", target: "Alex Brown", timestamp: hoursAgo(72) },
  { id: "act7", type: "invitation_sent", actor: "Jane Smith", target: "tom@example.com", details: "Viewer", timestamp: hoursAgo(96) },
  { id: "act8", type: "login", actor: "Mike Johnson", timestamp: hoursAgo(120) },
];

const getActivityIcon = (type: ActivityLogEntry["type"]) => {
  switch (type) {
    case "login":
      return <LogIn className="h-4 w-4 text-info" />;
    case "role_change":
      return <Shield className="h-4 w-4 text-warning" />;
    case "invitation_sent":
      return <Send className="h-4 w-4 text-primary" />;
    case "invitation_accepted":
      return <UserPlus className="h-4 w-4 text-success" />;
    case "member_removed":
      return <UserMinus className="h-4 w-4 text-destructive" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityMessage = (entry: ActivityLogEntry): string => {
  switch (entry.type) {
    case "login":
      return `${entry.actor} logged in`;
    case "role_change":
      return `${entry.actor} changed ${entry.target}'s role to ${entry.details?.split(" → ")[1]}`;
    case "invitation_sent":
      return `${entry.actor} invited ${entry.target} as ${entry.details}`;
    case "invitation_accepted":
      return `${entry.actor} accepted the invitation and joined the team`;
    case "member_removed":
      return `${entry.actor} removed ${entry.target} from the team`;
    default:
      return "Unknown activity";
  }
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export default function SettingsPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>(initialPendingInvitations);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);
  const [editRole, setEditRole] = useState("");

  // Auto-remove expired invitations on mount and periodically
  useEffect(() => {
    const removeExpired = () => {
      setPendingInvitations(prev => {
        const now = new Date();
        const active = prev.filter(inv => inv.expiresAt.getTime() > now.getTime());
        if (active.length < prev.length) {
          const expiredCount = prev.length - active.length;
          toast.info(`${expiredCount} expired invitation${expiredCount !== 1 ? 's' : ''} removed`);
        }
        return active;
      });
    };

    removeExpired();
    // Check every minute for expired invitations
    const interval = setInterval(removeExpired, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    // Add to pending invitations with expiry date
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const newInvitation: PendingInvitation = {
      id: `inv${Date.now()}`,
      email: inviteEmail,
      role: inviteRole as PendingInvitation["role"],
      sentAt: now,
      expiresAt,
    };
    setPendingInvitations(prev => [newInvitation, ...prev]);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("editor");
    setIsInviteDialogOpen(false);
  };

  const handleRemoveMember = () => {
    if (memberToRemove) {
      setTeamMembers(members => members.filter(m => m.id !== memberToRemove.id));
      toast.success(`${memberToRemove.name} has been removed from the team`);
      setMemberToRemove(null);
    }
  };

  const handleUpdateRole = () => {
    if (memberToEdit && editRole) {
      setTeamMembers(members => 
        members.map(m => 
          m.id === memberToEdit.id ? { ...m, role: editRole as TeamMember["role"] } : m
        )
      );
      toast.success(`${memberToEdit.name}'s role updated to ${roleLabels[editRole]}`);
      setMemberToEdit(null);
      setEditRole("");
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setMemberToEdit(member);
    setEditRole(member.role);
  };

  const handleResendInvitation = (invitation: PendingInvitation) => {
    // Reset expiry when resending
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    setPendingInvitations(prev => 
      prev.map(inv => 
        inv.id === invitation.id 
          ? { ...inv, sentAt: now, expiresAt: newExpiresAt }
          : inv
      )
    );
    toast.success(`Invitation resent to ${invitation.email}`);
  };

  const handleCancelInvitation = () => {
    if (invitationToCancel) {
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationToCancel.id));
      toast.success(`Invitation to ${invitationToCancel.email} cancelled`);
      setInvitationToCancel(null);
    }
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      
      <div className="p-6">
        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {/* Transactional */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Transactional</CardTitle>
                    <CardDescription>Email sending limits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly limit</span>
                    <span className="font-medium">6 / 3,000</span>
                  </div>
                  <Progress value={0.2} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily limit</span>
                    <span className="font-medium">1 / 100</span>
                  </div>
                  <Progress value={1} className="h-2" />
                </div>
                <Button variant="outline">
                  Upgrade plan
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Marketing */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                    <Megaphone className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Marketing</CardTitle>
                    <CardDescription>Audience and broadcast limits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contacts</span>
                    <span className="font-medium">4 / 1,000</span>
                  </div>
                  <Progress value={0.4} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Audiences</span>
                    <span className="font-medium">1 / 1</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Broadcasts</span>
                  <Badge variant="secondary">Unlimited</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <CreditCard className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                    <CardDescription>You're on the Free plan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Free</h3>
                    <span className="text-2xl font-bold">$0<span className="text-sm text-muted-foreground font-normal">/mo</span></span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 3,000 emails/month</li>
                    <li>• 1 domain</li>
                    <li>• 1,000 contacts</li>
                  </ul>
                </div>
                <Button>
                  Upgrade to Pro
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Users2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <CardDescription>Manage who has access to your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {roleLabels[member.role]}
                        </Badge>
                        {member.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                Change role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setMemberToRemove(member)}
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4" onClick={() => setIsInviteDialogOpen(true)}>
                  Invite team member
                </Button>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Pending Invitations</CardTitle>
                      <CardDescription>{pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''} waiting to be accepted</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border">
                    {pendingInvitations.map((invitation) => {
                      const expiryStatus = getExpiryStatus(invitation.expiresAt);
                      return (
                        <div key={invitation.id} className={cn(
                          "flex items-center justify-between py-3",
                          expiryStatus.isExpiringSoon && "bg-warning/5 -mx-4 px-4 rounded-lg"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {invitation.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{invitation.email}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Sent {formatTimeAgo(invitation.sentAt)}</span>
                                <span>•</span>
                                <span className={cn(
                                  expiryStatus.isExpiringSoon && "text-warning font-medium",
                                  expiryStatus.isExpired && "text-destructive font-medium"
                                )}>
                                  {expiryStatus.isExpiringSoon && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                                  {expiryStatus.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResendInvitation(invitation)}
                            >
                              <Send className="mr-1 h-3.5 w-3.5" />
                              Resend
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setInvitationToCancel(invitation)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                    <Activity className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                    <CardDescription>Recent team activity and events</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivityLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {getActivityIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {getActivityMessage(entry)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smtp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Server className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SMTP Settings</CardTitle>
                    <CardDescription>Use SMTP to send emails from your applications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Host</p>
                    <code className="block rounded bg-muted px-3 py-2 font-mono text-sm">smtp.monosend.co</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Port</p>
                    <code className="block rounded bg-muted px-3 py-2 font-mono text-sm">587 (STARTTLS)</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <code className="block rounded bg-muted px-3 py-2 font-mono text-sm">monosend</code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Password</p>
                    <code className="block rounded bg-muted px-3 py-2 font-mono text-sm">Your API key</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                    <Link2 className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Integrations</CardTitle>
                    <CardDescription>Connect MonoSend with your favorite tools</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No integrations configured yet.</p>
                <Button variant="outline" className="mt-4">
                  Browse integrations
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Team Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on your MonoSend account. They'll receive an email with instructions to join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                  <SelectItem value="editor">Editor - Can edit projects</SelectItem>
                  <SelectItem value="admin">Admin - Can manage settings</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === "viewer" && "Viewers can see all data but cannot make changes."}
                {inviteRole === "editor" && "Editors can create and edit emails, domains, and campaigns."}
                {inviteRole === "admin" && "Admins have full access including billing and team management."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              Update the role for {memberToEdit?.name}. This will change their permissions immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current member</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {memberToEdit?.avatar}
                </div>
                <div>
                  <p className="font-medium">{memberToEdit?.name}</p>
                  <p className="text-sm text-muted-foreground">{memberToEdit?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editRole">New role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                  <SelectItem value="editor">Editor - Can edit projects</SelectItem>
                  <SelectItem value="admin">Admin - Can manage settings</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editRole === "viewer" && "Viewers can see all data but cannot make changes."}
                {editRole === "editor" && "Editors can create and edit emails, domains, and campaigns."}
                {editRole === "admin" && "Admins have full access including billing and team management."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToEdit(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove team member"
        description={`Are you sure you want to remove ${memberToRemove?.name} (${memberToRemove?.email}) from your team? They will immediately lose access to your account.`}
        confirmLabel="Remove member"
        onConfirm={handleRemoveMember}
      />

      {/* Cancel Invitation Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!invitationToCancel}
        onOpenChange={(open) => !open && setInvitationToCancel(null)}
        title="Cancel invitation"
        description={`Are you sure you want to cancel the invitation to ${invitationToCancel?.email}? They will no longer be able to join your team using this invitation.`}
        confirmLabel="Cancel invitation"
        onConfirm={handleCancelInvitation}
      />
    </>
  );
}
