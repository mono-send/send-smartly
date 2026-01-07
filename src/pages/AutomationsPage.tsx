import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, ArrowRight, Clock, Mail, LogOut, Plus, Minus, Info, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
}

interface ContactCategory {
  id: string;
  name: string;
}

interface EmailStep {
  id: string;
  sender: string;
  subject: string;
  content: string;
  waitTime: number;
  waitUnit: string;
}

export default function AutomationsPage() {
  const navigate = useNavigate();
  const [waitTime, setWaitTime] = useState(1);
  const [waitUnit, setWaitUnit] = useState("min");
  const [exitCondition, setExitCondition] = useState("completed");
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [contactCategories, setContactCategories] = useState<ContactCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Inline title editing
  const [automationTitle, setAutomationTitle] = useState("Untitled Automation");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Email steps
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [emailWaitTime, setEmailWaitTime] = useState(5);
  const [emailWaitUnit, setEmailWaitUnit] = useState("day");

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const handleAddEmail = () => {
    setEditingEmailId(null);
    setEmailSender("");
    setEmailSubject("");
    setEmailContent("");
    setEmailWaitTime(5);
    setEmailWaitUnit("day");
    setEmailDialogOpen(true);
  };

  const handleEditEmail = (email: EmailStep) => {
    setEditingEmailId(email.id);
    setEmailSender(email.sender);
    setEmailSubject(email.subject);
    setEmailContent(email.content);
    setEmailWaitTime(email.waitTime);
    setEmailWaitUnit(email.waitUnit);
    setEmailDialogOpen(true);
  };

  const handleDeleteEmail = (id: string) => {
    setEmailSteps(emailSteps.filter(e => e.id !== id));
    toast.success("Email step removed");
  };

  const handleSaveEmail = () => {
    if (!emailSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }

    if (editingEmailId) {
      // Update existing
      setEmailSteps(emailSteps.map(e =>
        e.id === editingEmailId
          ? { ...e, sender: emailSender, subject: emailSubject, content: emailContent, waitTime: emailWaitTime, waitUnit: emailWaitUnit }
          : e
      ));
      toast.success("Email step updated");
    } else {
      // Add new
      const newEmail: EmailStep = {
        id: crypto.randomUUID(),
        sender: emailSender,
        subject: emailSubject,
        content: emailContent,
        waitTime: emailWaitTime,
        waitUnit: emailWaitUnit,
      };
      setEmailSteps([...emailSteps, newEmail]);
      toast.success("Email step added");
    }
    setEmailDialogOpen(false);
  };

  useEffect(() => {
    const fetchSegments = async () => {
      setIsLoadingSegments(true);
      try {
        const response = await api("/segments");
        if (!response.ok) {
          toast.error("Failed to load segments");
          return;
        }

        const data = await response.json();
        setSegments(data.items || []);
      } catch (error) {
        toast.error("Failed to load segments");
      } finally {
        setIsLoadingSegments(false);
      }
    };

    const fetchContactCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await api("/contact-categories");
        if (!response.ok) {
          toast.error("Failed to load unsubscribe groups");
          return;
        }

        const data = await response.json();
        setContactCategories(data.items || []);
      } catch (error) {
        toast.error("Failed to load unsubscribe groups");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchSegments();
    fetchContactCategories();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => navigate(-1)}
          >
            <X className="h-4 w-4" />
          </Button>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={automationTitle}
              onChange={(e) => setAutomationTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={handleTitleKeyDown}
              className="h-8 w-64 font-medium"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors group"
            >
              {automationTitle}
              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            DRAFT
          </div>
          <Button variant="secondary" className="h-9 text-xs">
            Save
          </Button>
          <Button className="h-9 text-xs">
            Activate
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Flow Builder */}
        <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(circle,#73737350_1px,transparent_1px)] 
bg-[size:10px_10px]">
          <div className="max-w-2xl mx-auto space-y-0">
            {/* Entry Block */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <ArrowRight className="h-4 w-4" />
                TRIGGER
              </div>
              <p className="text-sm text-foreground mb-2">
                When the contact enters <span className="text-destructive">*</span>
              </p>
              <Select
                value={selectedSegment}
                onValueChange={setSelectedSegment}
                disabled={isLoadingSegments}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={isLoadingSegments ? "Loading segments..." : "Select a List or Segment"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSegments ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : segments.length ? (
                    segments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-segments" disabled>
                      No segments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </Card>

            {/* Connector */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <div className="h-1.5 w-1.5 rounded-full bg-border" />
                <div className="w-px h-4 bg-border" />
              </div>
            </div>

            {/* Email Steps */}
            {emailSteps.map((email, index) => (
              <div key={email.id}>
                {/* Wait For Block for this email */}
                <Card className="px-4 py-2 max-w-[400px] mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock className="h-4 w-4" />
                      WAIT FOR
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 items-stretch rounded-md border bg-background overflow-hidden divide-x divide-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full w-10 rounded-none"
                          onClick={() => {
                            const updatedSteps = [...emailSteps];
                            updatedSteps[index] = { ...email, waitTime: Math.max(0, email.waitTime - 1) };
                            setEmailSteps(updatedSteps);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={email.waitTime}
                          onChange={(e) => {
                            const updatedSteps = [...emailSteps];
                            updatedSteps[index] = { ...email, waitTime: parseInt(e.target.value) || 1 };
                            setEmailSteps(updatedSteps);
                          }}
                          className="h-full w-16 border-0 rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-full w-10 rounded-none"
                          onClick={() => {
                            const updatedSteps = [...emailSteps];
                            updatedSteps[index] = { ...email, waitTime: email.waitTime + 1 };
                            setEmailSteps(updatedSteps);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Select
                        value={email.waitUnit}
                        onValueChange={(value) => {
                          const updatedSteps = [...emailSteps];
                          updatedSteps[index] = { ...email, waitUnit: value };
                          setEmailSteps(updatedSteps);
                        }}
                      >
                        <SelectTrigger className="w-24 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="min">min(s)</SelectItem>
                          <SelectItem value="hour">hour(s)</SelectItem>
                          <SelectItem value="day">day(s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Connector */}
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 bg-border" />
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    <div className="w-px h-4 bg-border" />
                  </div>
                </div>

                {/* Email Card */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Mail className="h-4 w-4" />
                      EMAIL {index + 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditEmail(email)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEmail(email.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground truncate">
                    {email.subject}
                  </div>
                </Card>

                {/* Connector after each email */}
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 bg-border" />
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    <div className="w-px h-4 bg-border" />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Email Block */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="w-full max-w-xs justify-center gap-2 text-sm font-medium"
                onClick={handleAddEmail}
              >
                <Mail className="h-4 w-4" />
                ADD EMAIL
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Email Configuration Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEmailId ? "Edit Email Step" : "Add Email Step"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-sender">Sender</Label>
                    <Input
                      id="email-sender"
                      placeholder="noreply@yourdomain.com"
                      value={emailSender}
                      onChange={(e) => setEmailSender(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject <span className="text-destructive">*</span></Label>
                    <Input
                      id="email-subject"
                      placeholder="Welcome to our newsletter!"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-content">Content</Label>
                    <Textarea
                      id="email-content"
                      placeholder="Write your email content here..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEmail}>
                    {editingEmailId ? "Save Changes" : "Add Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Connector */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <div className="h-1.5 w-1.5 rounded-full bg-border" />
                <div className="w-px h-4 bg-border" />
              </div>
            </div>

            {/* Exit Block */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
                <LogOut className="h-4 w-4" />
                EXIT
              </div>
              <div className="space-y-3">
                <label 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    exitCondition === "completed" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setExitCondition("completed")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    exitCondition === "completed" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {exitCondition === "completed" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">When the contact has received all the automation emails</span>
                </label>
                <label 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    exitCondition === "removed" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => setExitCondition("removed")}
                >
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    exitCondition === "removed" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {exitCondition === "removed" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">Contact is no longer a part of the list / segment</span>
                </label>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-background p-6 space-y-6">
          {/* Unsubscribe Group */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Unsubscribe Group <span className="text-destructive">*</span>
              </label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={isLoadingCategories ? "Loading unsubscribe groups..." : "Select a group"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : contactCategories.length ? (
                  contactCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No unsubscribe groups available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">Tracking</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Switch 
                  checked={trackOpens} 
                  onCheckedChange={setTrackOpens}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Open rate</p>
                  <p className="text-xs text-muted-foreground">
                    An invisible image is being appended to HTML emails to track if they have been opened.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Switch 
                  checked={trackClicks} 
                  onCheckedChange={setTrackClicks}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Clicks</p>
                  <p className="text-xs text-muted-foreground">
                    MonoSend track clicks by rewriting links in your email. When clicked, they pass through a MonoSend server before redirecting to the original URL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
