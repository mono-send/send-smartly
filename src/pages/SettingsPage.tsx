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
import { Mail, Megaphone, CreditCard, Users2, Server, Link2, ArrowUpRight, MoreHorizontal, Clock, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  sentAt: string;
}

const initialPendingInvitations: PendingInvitation[] = [
  { id: "inv1", email: "sarah@example.com", role: "editor", sentAt: "2 hours ago" },
  { id: "inv2", email: "tom@example.com", role: "viewer", sentAt: "1 day ago" },
];

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

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    // Add to pending invitations
    const newInvitation: PendingInvitation = {
      id: `inv${Date.now()}`,
      email: inviteEmail,
      role: inviteRole as PendingInvitation["role"],
      sentAt: "Just now",
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
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {invitation.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-sm text-muted-foreground">Sent {invitation.sentAt}</p>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
