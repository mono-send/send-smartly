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
import { Mail, Megaphone, CreditCard, Users2, Server, Link2, ArrowUpRight, MoreHorizontal, Clock, Send, X, LogIn, UserMinus, Shield, Activity, Filter, CalendarIcon, Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { api } from "@/lib/api";

interface ApiTeamMember {
  id: string;
  role: string;
  user_id: string;
  status: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  joined_at: string;
  email?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "developer" | "marketer";
  avatar: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "developer" | "marketer";
  sentAt: Date;
}

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


interface ApiActivityLogEntry {
  id: string;
  account_id: string;
  actor_id: string;
  subject: string;
  description: string | null;
  category: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name: string;
  actor_email: string;
}

interface ActivityLogEntry {
  id: string;
  type: "login" | "role_change" | "invitation" | "removal";
  actor: string;
  subject: string;
  description?: string;
  timestamp: Date;
}

const ACTIVITY_PAGE_SIZE = 5;

const getActivityIcon = (type: ActivityLogEntry["type"]) => {
  switch (type) {
    case "login":
      return <LogIn className="h-4 w-4 text-info" />;
    case "role_change":
      return <Shield className="h-4 w-4 text-warning" />;
    case "invitation":
      return <Send className="h-4 w-4 text-primary" />;
    case "removal":
      return <UserMinus className="h-4 w-4 text-destructive" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const mapApiCategoryToType = (category: string): ActivityLogEntry["type"] => {
  switch (category) {
    case "login":
      return "login";
    case "role_change":
      return "role_change";
    case "invitation":
      return "invitation";
    case "removal":
      return "removal";
    default:
      return "login";
  }
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  developer: "Developer",
  marketer: "Marketer",
};

export default function SettingsPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isResendingInvitation, setIsResendingInvitation] = useState<string | null>(null);
  const [isCancellingInvitation, setIsCancellingInvitation] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<PendingInvitation | null>(null);
  const [editRole, setEditRole] = useState("");
  const [activityVisibleCount, setActivityVisibleCount] = useState(ACTIVITY_PAGE_SIZE);
  const [activityFilter, setActivityFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Fetch activity log from API
  useEffect(() => {
    const fetchActivityLog = async () => {
      setIsLoadingActivity(true);
      try {
        const response = await api("/activity_logs");
        if (response.ok) {
          const data = await response.json();
          const mappedLogs: ActivityLogEntry[] = data.items.map((item: ApiActivityLogEntry) => ({
            id: item.id,
            type: mapApiCategoryToType(item.category),
            actor: item.actor_name,
            subject: item.subject,
            description: item.description,
            timestamp: new Date(item.created_at),
          }));
          setActivityLog(mappedLogs);
        } else {
          toast.error("Failed to load activity log");
        }
      } catch (error) {
        console.error("Error fetching activity log:", error);
        toast.error("Failed to load activity log");
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchActivityLog();
  }, []);

  // Fetch team members from API
  const fetchTeamMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await api("/team_members?status=accepted");
      if (response.ok) {
        const data = await response.json();
        const mapped: TeamMember[] = data.items.map((item: ApiTeamMember) => ({
          id: item.id,
          name: item.name || "Unknown",
          email: item.email || "",
          role: item.role as TeamMember["role"],
          avatar: (item.name || "U").charAt(0).toUpperCase(),
        }));
        setTeamMembers(mapped);
      } else {
        toast.error("Failed to load team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch pending invitations from API
  const fetchPendingInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const response = await api("/team_members?status=invited");
      if (response.ok) {
        const data = await response.json();
        const mapped: PendingInvitation[] = data.items.map((item: ApiTeamMember) => ({
          id: item.id,
          email: item.email || "",
          name: item.name || "",
          role: item.role as PendingInvitation["role"],
          sentAt: new Date(item.joined_at),
        }));
        setPendingInvitations(mapped);
      } else {
        toast.error("Failed to load pending invitations");
      }
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      toast.error("Failed to load pending invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchPendingInvitations();
  }, []);

  const filteredActivityLog = activityLog.filter(entry => {
    // Type filter
    if (activityFilter.length > 0 && !activityFilter.includes(entry.type)) {
      return false;
    }
    // Date range filter
    if (dateRange?.from && entry.timestamp < dateRange.from) {
      return false;
    }
    if (dateRange?.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      if (entry.timestamp > endOfDay) {
        return false;
      }
    }
    return true;
  });
  const visibleActivityLog = filteredActivityLog.slice(0, activityVisibleCount);
  const hasMoreActivity = activityVisibleCount < filteredActivityLog.length;

  const loadMoreActivity = () => {
    setActivityVisibleCount(prev => Math.min(prev + ACTIVITY_PAGE_SIZE, filteredActivityLog.length));
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  // Reset visible count when filter changes
  useEffect(() => {
    setActivityVisibleCount(ACTIVITY_PAGE_SIZE);
  }, [activityFilter, dateRange]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setIsInviting(true);
    try {
      const response = await api("/team_members/invite", {
        method: "POST",
        body: { email: inviteEmail, role: inviteRole },
      });
      if (response.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setInviteRole("developer");
        setIsInviteDialogOpen(false);
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        toast.error(error.detail || error.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);
    try {
      const response = await api(`/team_members/${memberToRemove.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(`${memberToRemove.name} has been removed from the team`);
        setMemberToRemove(null);
        fetchTeamMembers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Error removing team member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!memberToEdit || !editRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await api(`/team_members/${memberToEdit.id}`, {
        method: "PUT",
        body: { role: editRole },
      });
      if (response.ok) {
        toast.success(`${memberToEdit.name}'s role updated to ${roleLabels[editRole]}`);
        setMemberToEdit(null);
        setEditRole("");
        fetchTeamMembers();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setMemberToEdit(member);
    setEditRole(member.role);
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    setIsResendingInvitation(invitation.id);
    try {
      const response = await api(`/team_members/${invitation.id}/resend_invitation`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Invitation resent to ${data.email}`);
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        toast.error(error.detail || error.message || "Failed to resend invitation");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    } finally {
      setIsResendingInvitation(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;

    setIsCancellingInvitation(true);
    try {
      const response = await api(`/team_members/${invitationToCancel.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(`Invitation to ${invitationToCancel.email} cancelled`);
        setInvitationToCancel(null);
        fetchPendingInvitations();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error("Failed to cancel invitation");
    } finally {
      setIsCancellingInvitation(false);
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
                <Button variant="outline" className="h-9">
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
                <Button className="h-9">
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
                {isLoadingMembers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No team members found
                  </p>
                ) : (
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
                )}
                <Button variant="outline" className="mt-4 h-9" onClick={() => setIsInviteDialogOpen(true)}>
                  Invite team member
                </Button>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {(isLoadingInvitations || pendingInvitations.length > 0) && (
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
                  {isLoadingInvitations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {pendingInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {(invitation.name || invitation.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{invitation.name || invitation.email}</p>
                              <p className="text-sm text-muted-foreground">
                                Invited {formatTimeAgo(invitation.sentAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation)}
                              disabled={isResendingInvitation === invitation.id}
                            >
                              {isResendingInvitation === invitation.id ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3.5 w-3.5" />
                              )}
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
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                      <Activity className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Activity Log</CardTitle>
                      <CardDescription>Recent team activity and events</CardDescription>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <ToggleGroup
                      type="multiple"
                      value={activityFilter}
                      onValueChange={setActivityFilter}
                      className="flex-wrap justify-start"
                    >
                      <ToggleGroupItem value="login" size="sm" className="text-xs gap-1">
                        <LogIn className="h-3 w-3" /> Logins
                      </ToggleGroupItem>
                      <ToggleGroupItem value="invitation" size="sm" className="text-xs gap-1">
                        <Send className="h-3 w-3" /> Invitations
                      </ToggleGroupItem>
                      <ToggleGroupItem value="role_change" size="sm" className="text-xs gap-1">
                        <Shield className="h-3 w-3" /> Role Changes
                      </ToggleGroupItem>
                      <ToggleGroupItem value="removal" size="sm" className="text-xs gap-1">
                        <UserMinus className="h-3 w-3" /> Removed
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "justify-start text-left font-normal text-xs",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM d, yyyy")
                            )
                          ) : (
                            <span>Select date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {dateRange && (
                      <Button variant="ghost" size="sm" onClick={clearDateRange} className="h-8 px-2">
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredActivityLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activities match the selected filters
                  </p>
                ) : (
                  <div className="space-y-4">
                    {visibleActivityLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {getActivityIcon(entry.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            {entry.subject}
                          </p>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground">
                              {entry.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.actor} • {formatTimeAgo(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {hasMoreActivity && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={loadMoreActivity}
                    >
                      Load more ({filteredActivityLog.length - activityVisibleCount} remaining)
                    </Button>
                  </div>
                )}
                {!hasMoreActivity && filteredActivityLog.length > ACTIVITY_PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border">
                    Showing all {filteredActivityLog.length} activities
                  </p>
                )}
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
                <Button variant="outline" className="mt-4 h-9">
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
                  <SelectItem value="marketer">Marketer - Marketing emails & campaigns</SelectItem>
                  <SelectItem value="developer">Developer - Transactional emails & API</SelectItem>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {inviteRole === "marketer" &&
                  "Can manage marketing emails, campaigns, audiences, and view analytics. No access to domains, APIs, billing, or team settings."}
                {inviteRole === "developer" &&
                  "Can manage transactional emails, domains, API keys, and integrations. No access to billing or team management."}
                {inviteRole === "admin" &&
                  "Full access including billing, domains, API keys, and team management."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button className="h-9" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button className="h-9" onClick={handleInvite} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  <SelectItem value="marketer">Marketer - Marketing emails & campaigns</SelectItem>
                  <SelectItem value="developer">Developer - Transactional emails & API</SelectItem>
                  <SelectItem value="admin">Admin - Full access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editRole === "marketer" && "Can manage marketing emails, campaigns, audiences, and view analytics. No access to domains, APIs, billing, or team settings."}
                {editRole === "developer" && "Can manage transactional emails, domains, API keys, and integrations. No access to billing or team management."}
                {editRole === "admin" && "Full access including billing, domains, API keys, and team management."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToEdit(null)} disabled={isUpdatingRole}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdatingRole}>
              {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && !isRemovingMember && setMemberToRemove(null)}
        title="Remove team member"
        description={`Are you sure you want to remove ${memberToRemove?.name} (${memberToRemove?.email}) from your team? They will immediately lose access to your account.`}
        confirmLabel="Remove member"
        onConfirm={handleRemoveMember}
        isLoading={isRemovingMember}
      />

      {/* Cancel Invitation Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!invitationToCancel}
        onOpenChange={(open) => !open && !isCancellingInvitation && setInvitationToCancel(null)}
        title="Cancel invitation"
        description={`Are you sure you want to cancel the invitation to ${invitationToCancel?.email}? They will no longer be able to join your team using this invitation.`}
        confirmLabel="Cancel invitation"
        onConfirm={handleCancelInvitation}
        isLoading={isCancellingInvitation}
      />
    </>
  );
}
