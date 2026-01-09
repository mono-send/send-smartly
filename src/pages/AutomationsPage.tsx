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
import { X, ArrowRight, Clock, Mail, LogOut, Plus, Minus, Info, Pencil, Trash2, GripVertical, GitBranch, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Segment {
  id: string;
  name: string;
}

interface ContactCategory {
  id: string;
  name: string;
}

interface Sender {
  id: string;
  name: string;
  from: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailStep {
  id: string;
  sender: string;
  subject: string;
  content: string;
  templateId: string | null;
  waitTime: number;
  waitUnit: string;
}

interface ConditionBranch {
  id: string;
  conditionType: 'opened' | 'clicked' | 'not_opened' | 'not_clicked';
  targetEmailId: string; // Reference to which email to check
  yesBranch: {
    waitTime: number;
    waitUnit: string;
    email: EmailStep | null;
  };
  noBranch: {
    waitTime: number;
    waitUnit: string;
    email: EmailStep | null;
  };
}

interface SortableEmailStepProps {
  email: EmailStep;
  index: number;
  emailSteps: EmailStep[];
  setEmailSteps: (steps: EmailStep[]) => void;
  handleEditEmail: (email: EmailStep) => void;
  handleDeleteEmail: (id: string) => void;
  showAddCondition: boolean;
  onAddCondition: (emailId: string) => void;
  hasCondition: boolean;
}

function SortableEmailStep({
  email,
  index,
  emailSteps,
  setEmailSteps,
  handleEditEmail,
  handleDeleteEmail,
  showAddCondition,
  onAddCondition,
  hasCondition
}: SortableEmailStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: email.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
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
          <div className="w-px h-4 bg-[#999]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
          <div className="w-px h-4 bg-[#999]" />
        </div>
      </div>

      {/* Email Card with drag handle */}
      <Card className="p-4 relative group">
        {/* Drag Handle - Top Left */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Header with Email title and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4" />
            EMAIL {index + 1}
          </div>
          <div className="flex items-center gap-1">
            {showAddCondition && !hasCondition && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={() => onAddCondition(email.id)}
                title="Add condition branch"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => handleEditEmail(email)}
              title="Edit Email Step"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => handleDeleteEmail(email.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
          <div className="w-px h-4 bg-[#999]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
          <div className="w-px h-4 bg-[#999]" />
        </div>
      </div>
    </div>
  );
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
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoadingSenders, setIsLoadingSenders] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Inline title editing
  const [automationTitle, setAutomationTitle] = useState("Untitled Automation");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Email steps
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);
  const [conditionBranch, setConditionBranch] = useState<ConditionBranch | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<string | null>(null);
  const [emailWaitTime, setEmailWaitTime] = useState(5);
  const [emailWaitUnit, setEmailWaitUnit] = useState("day");
  
  // For editing branch emails
  const [editingBranchType, setEditingBranchType] = useState<'yes' | 'no' | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEmailSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Email order updated");
    }
  };

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
    setEmailTemplateId(null);
    setEmailWaitTime(5);
    setEmailWaitUnit("day");
    setEmailDialogOpen(true);
  };

  const handleEditEmail = (email: EmailStep) => {
    setEditingEmailId(email.id);
    setEmailSender(email.sender);
    setEmailSubject(email.subject);
    setEmailContent(email.content);
    setEmailTemplateId(email.templateId ?? null);
    setEmailWaitTime(email.waitTime);
    setEmailWaitUnit(email.waitUnit);
    setEmailDialogOpen(true);
  };

  const handleDeleteEmail = (id: string) => {
    setEmailSteps(emailSteps.filter(e => e.id !== id));
    // Also remove condition if it references this email
    if (conditionBranch?.targetEmailId === id) {
      setConditionBranch(null);
    }
    toast.success("Email step removed");
  };

  const handleAddCondition = (emailId: string) => {
    setConditionBranch({
      id: crypto.randomUUID(),
      conditionType: 'opened',
      targetEmailId: emailId,
      yesBranch: {
        waitTime: 1,
        waitUnit: 'day',
        email: null,
      },
      noBranch: {
        waitTime: 3,
        waitUnit: 'day',
        email: null,
      },
    });
    toast.success("Condition added");
  };

  const handleRemoveCondition = () => {
    setConditionBranch(null);
    toast.success("Condition removed");
  };

  const handleAddBranchEmail = (branchType: 'yes' | 'no') => {
    setEditingEmailId(null);
    setEditingBranchType(branchType);
    setEmailSender("");
    setEmailSubject("");
    setEmailContent("");
    setEmailTemplateId(null);
    setEmailWaitTime(5);
    setEmailWaitUnit("day");
    setEmailDialogOpen(true);
  };

  const handleEditBranchEmail = (branchType: 'yes' | 'no', email: EmailStep) => {
    setEditingEmailId(email.id);
    setEditingBranchType(branchType);
    setEmailSender(email.sender);
    setEmailSubject(email.subject);
    setEmailContent(email.content);
    setEmailTemplateId(email.templateId ?? null);
    setEmailWaitTime(email.waitTime);
    setEmailWaitUnit(email.waitUnit);
    setEmailDialogOpen(true);
  };

  const handleDeleteBranchEmail = (branchType: 'yes' | 'no') => {
    if (!conditionBranch) return;
    if (branchType === 'yes') {
      setConditionBranch({ ...conditionBranch, yesBranch: { ...conditionBranch.yesBranch, email: null } });
    } else {
      setConditionBranch({ ...conditionBranch, noBranch: { ...conditionBranch.noBranch, email: null } });
    }
    toast.success("Email removed from branch");
  };

  const handleSaveEmail = () => {
    if (!emailSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }

    // Handle branch email
    if (editingBranchType && conditionBranch) {
      const newEmail: EmailStep = {
        id: editingEmailId || crypto.randomUUID(),
        sender: emailSender,
        subject: emailSubject,
        content: emailContent,
        templateId: emailTemplateId,
        waitTime: emailWaitTime,
        waitUnit: emailWaitUnit,
      };
      
      if (editingBranchType === 'yes') {
        setConditionBranch({
          ...conditionBranch,
          yesBranch: { ...conditionBranch.yesBranch, email: newEmail }
        });
      } else {
        setConditionBranch({
          ...conditionBranch,
          noBranch: { ...conditionBranch.noBranch, email: newEmail }
        });
      }
      
      toast.success(editingEmailId ? "Branch email updated" : "Branch email added");
      setEditingBranchType(null);
      setEmailDialogOpen(false);
      return;
    }

    if (editingEmailId) {
      // Update existing
      setEmailSteps(emailSteps.map(e =>
        e.id === editingEmailId
          ? { ...e, sender: emailSender, subject: emailSubject, content: emailContent, templateId: emailTemplateId, waitTime: emailWaitTime, waitUnit: emailWaitUnit }
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
        templateId: emailTemplateId,
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

    const fetchSenders = async () => {
      setIsLoadingSenders(true);
      try {
        const response = await api("/senders");
        if (!response.ok) {
          toast.error("Failed to load senders");
          return;
        }

        const data = await response.json();
        setSenders(data || []);
      } catch (error) {
        toast.error("Failed to load senders");
      } finally {
        setIsLoadingSenders(false);
      }
    };

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await api("/templates");
        if (!response.ok) {
          toast.error("Failed to load templates");
          return;
        }

        const data = await response.json();
        setTemplates(data.items || data || []);
      } catch (error) {
        toast.error("Failed to load templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchSegments();
    fetchContactCategories();
    fetchSenders();
    fetchTemplates();
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
                <div className="w-px h-4 bg-[#999]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                <div className="w-px h-4 bg-[#999]" />
              </div>
            </div>

            {/* Email Steps with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={emailSteps.map(email => email.id)}
                strategy={verticalListSortingStrategy}
              >
                {emailSteps.map((email, index) => (
                  <SortableEmailStep
                    key={email.id}
                    email={email}
                    index={index}
                    emailSteps={emailSteps}
                    setEmailSteps={setEmailSteps}
                    handleEditEmail={handleEditEmail}
                    handleDeleteEmail={handleDeleteEmail}
                    showAddCondition={index === 0}
                    onAddCondition={handleAddCondition}
                    hasCondition={conditionBranch?.targetEmailId === email.id}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Condition Branch UI - shown after first email if condition exists */}
            {conditionBranch && emailSteps.length > 0 && (
              <div className="relative">
                {/* IF Condition Block */}
                <Card className="p-4 border-2 border-dashed border-primary/50 bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <GitBranch className="h-4 w-4 text-primary" />
                      IF CONDITION
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={handleRemoveCondition}
                      title="Remove condition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span>Contact</span>
                    <Select
                      value={conditionBranch.conditionType}
                      onValueChange={(value: 'opened' | 'clicked' | 'not_opened' | 'not_clicked') => 
                        setConditionBranch({ ...conditionBranch, conditionType: value })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opened">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            opened
                          </div>
                        </SelectItem>
                        <SelectItem value="not_opened">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-3 w-3" />
                            didn't open
                          </div>
                        </SelectItem>
                        <SelectItem value="clicked">clicked</SelectItem>
                        <SelectItem value="not_clicked">didn't click</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="font-medium">EMAIL 1</span>
                  </div>
                </Card>

                {/* Branch connector - splits into YES and NO */}
                <div className="flex justify-center py-2">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-4 bg-[#999]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                  </div>
                </div>

                {/* YES and NO Branches side by side */}
                <div className="grid grid-cols-2 gap-6">
                  {/* YES Branch */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      YES
                    </div>
                    <div className="w-px h-4 bg-green-400" />
                    
                    {/* Wait time for YES branch */}
                    <Card className="px-3 py-2 w-full max-w-[180px] border-green-200 bg-green-50/50">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Wait</span>
                        <Input
                          type="number"
                          value={conditionBranch.yesBranch.waitTime}
                          onChange={(e) => setConditionBranch({
                            ...conditionBranch,
                            yesBranch: { ...conditionBranch.yesBranch, waitTime: parseInt(e.target.value) || 1 }
                          })}
                          className="h-6 w-12 text-center text-xs p-1"
                        />
                        <Select
                          value={conditionBranch.yesBranch.waitUnit}
                          onValueChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            yesBranch: { ...conditionBranch.yesBranch, waitUnit: value }
                          })}
                        >
                          <SelectTrigger className="h-6 w-16 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="min">min</SelectItem>
                            <SelectItem value="hour">hr</SelectItem>
                            <SelectItem value="day">day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                    
                    <div className="w-px h-4 bg-green-400" />
                    
                    {/* Email for YES branch */}
                    {conditionBranch.yesBranch.email ? (
                      <Card className="p-3 w-full max-w-[180px] border-green-200 group relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Mail className="h-3 w-3" />
                            EMAIL 2
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={() => handleEditBranchEmail('yes', conditionBranch.yesBranch.email!)}
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteBranchEmail('yes')}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conditionBranch.yesBranch.email.subject}
                        </p>
                      </Card>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full max-w-[180px] text-xs h-8 border-green-200 hover:border-green-400"
                        onClick={() => handleAddBranchEmail('yes')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Email
                      </Button>
                    )}
                  </div>

                  {/* NO Branch */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      NO
                    </div>
                    <div className="w-px h-4 bg-orange-400" />
                    
                    {/* Wait time for NO branch */}
                    <Card className="px-3 py-2 w-full max-w-[180px] border-orange-200 bg-orange-50/50">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Wait</span>
                        <Input
                          type="number"
                          value={conditionBranch.noBranch.waitTime}
                          onChange={(e) => setConditionBranch({
                            ...conditionBranch,
                            noBranch: { ...conditionBranch.noBranch, waitTime: parseInt(e.target.value) || 1 }
                          })}
                          className="h-6 w-12 text-center text-xs p-1"
                        />
                        <Select
                          value={conditionBranch.noBranch.waitUnit}
                          onValueChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            noBranch: { ...conditionBranch.noBranch, waitUnit: value }
                          })}
                        >
                          <SelectTrigger className="h-6 w-16 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="min">min</SelectItem>
                            <SelectItem value="hour">hr</SelectItem>
                            <SelectItem value="day">day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                    
                    <div className="w-px h-4 bg-orange-400" />
                    
                    {/* Email for NO branch */}
                    {conditionBranch.noBranch.email ? (
                      <Card className="p-3 w-full max-w-[180px] border-orange-200 group relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Mail className="h-3 w-3" />
                            EMAIL 2
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={() => handleEditBranchEmail('no', conditionBranch.noBranch.email!)}
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100"
                              onClick={() => handleDeleteBranchEmail('no')}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conditionBranch.noBranch.email.subject}
                        </p>
                      </Card>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full max-w-[180px] text-xs h-8 border-orange-200 hover:border-orange-400"
                        onClick={() => handleAddBranchEmail('no')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Email
                      </Button>
                    )}
                  </div>
                </div>

                {/* Merge connector */}
                <div className="flex justify-center py-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-[calc(50%-8px)] h-px bg-[#999]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                      <div className="w-[calc(50%-8px)] h-px bg-[#999]" />
                    </div>
                    <div className="w-px h-4 bg-[#999]" />
                  </div>
                </div>
              </div>
            )}

            {/* Add Email Block - shown when no condition or after condition */}
            {!conditionBranch && (
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
            )}

            {/* Email Configuration Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEmailId ? "Edit Email Step" : "Add Email Step"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-sender">Sender</Label>
                    <Select
                      value={emailSender}
                      onValueChange={setEmailSender}
                      disabled={isLoadingSenders}
                    >
                      <SelectTrigger id="email-sender">
                        <SelectValue placeholder={isLoadingSenders ? "Loading senders..." : "Select a sender"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSenders ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : senders.length ? (
                          senders.map((sender) => (
                            <SelectItem key={sender.id} value={sender.from}>
                              {sender.name} ({sender.from})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-senders" disabled>
                            No senders available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-template">Template</Label>
                    <Select
                      value={emailTemplateId ?? ""}
                      onValueChange={(value) => {
                        setEmailTemplateId(value || null);
                      }}
                      disabled={isLoadingTemplates}
                    >
                      <SelectTrigger id="email-template">
                        <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingTemplates ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : templates.length ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-templates" disabled>
                            No templates available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)} className="h-9">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEmail} className="h-9">
                    {editingEmailId ? "Save Changes" : "Add Email"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Connector */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-[#999]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                <div className="w-px h-4 bg-[#999]" />
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
