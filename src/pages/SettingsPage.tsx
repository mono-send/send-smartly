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
import { Mail, Megaphone, CreditCard, Users2, Server, Link2, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteRole("editor");
    setIsInviteDialogOpen(false);
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
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      U
                    </div>
                    <div>
                      <p className="font-medium">You</p>
                      <p className="text-sm text-muted-foreground">user@example.com</p>
                    </div>
                  </div>
                  <Badge>Owner</Badge>
                </div>
                <Button variant="outline" className="mt-4" onClick={() => setIsInviteDialogOpen(true)}>
                  Invite team member
                </Button>
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
    </>
  );
}
