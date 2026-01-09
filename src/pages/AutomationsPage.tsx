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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X, ArrowRight, Clock, Mail, LogOut, Plus, Minus, Info, Pencil, Trash2, GripVertical, GitBranch, Eye, EyeOff, MoreVertical, ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
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
  domain: {
    id: string;
    name: string;
  };
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailStep {
  id: string;
  senderId: string;
  senderFrom?: string;
  senderEmail?: string;
  subject: string;
  content: string;
  templateId: string | null;
  waitTime: number;
  waitUnit: string;
}

// Workflow API types
interface WorkflowStats {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  exited_enrollments: number;
}

interface WorkflowStepConfig {
  wait_duration?: number;
  wait_unit?: string;
  sender_id?: string;
  sender_name?: string;
  sender_email?: string;
  template_id?: string;
  template_name?: string;
  subject_override?: string | null;
  content_override?: string | null;
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_type: 'wait' | 'email' | 'condition';
  position: number;
  label: string | null;
  parent_step_id: string | null;
  branch: string | null;
  config: WorkflowStepConfig;
  created_at: string;
  updated_at: string;
}

interface WorkflowListItem {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_segment: { id: string; name: string } | null;
  active_version: number | null;
  draft_version: number;
  stats: WorkflowStats;
  has_unsaved_changes: boolean;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_segment: { id: string; name: string } | null;
  unsubscribe_category: { id: string; name: string } | null;
  track_opens: boolean;
  track_clicks: boolean;
  exit_on_all_emails: boolean;
  exit_on_segment_leave: boolean;
  active_version: number | null;
  draft_version: number;
  has_unsaved_changes: boolean;
  steps: WorkflowStep[];
  stats: WorkflowStats;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface WorkflowsResponse {
  data?: WorkflowListItem[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
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
  getSenderLabel: (email: EmailStep) => string;
}

interface WaitForControlProps {
  waitTime: number;
  waitUnit: string;
  onWaitTimeChange: (value: number) => void;
  onWaitUnitChange: (value: string) => void;
  size?: "default" | "compact";
}

function WaitForControl({
  waitTime,
  waitUnit,
  onWaitTimeChange,
  onWaitUnitChange,
  size = "default",
}: WaitForControlProps) {
  const isCompact = size === "compact";
  const segmentClassName = isCompact
    ? "flex h-7 items-stretch rounded-md border bg-background overflow-hidden divide-x divide-border"
    : "flex h-9 items-stretch rounded-md border bg-background overflow-hidden divide-x divide-border";
  const buttonClassName = isCompact ? "h-full w-8 rounded-none" : "h-full w-10 rounded-none";
  const inputClassName = isCompact
    ? "h-full w-12 border-0 rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
    : "h-full w-16 border-0 rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0";
  const selectClassName = isCompact ? "w-20 h-7 text-xs" : "w-24 h-9";

  return (
    <div className="flex items-center gap-2">
      <div className={segmentClassName}>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClassName}
          onClick={() => {
            onWaitTimeChange(Math.max(0, waitTime - 1));
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          value={waitTime}
          onChange={(e) => {
            onWaitTimeChange(parseInt(e.target.value) || 1);
          }}
          className={inputClassName}
        />
        <Button
          variant="ghost"
          size="icon"
          className={buttonClassName}
          onClick={() => {
            onWaitTimeChange(waitTime + 1);
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <Select
        value={waitUnit}
        onValueChange={(value) => {
          onWaitUnitChange(value);
        }}
      >
        <SelectTrigger className={selectClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="min">min(s)</SelectItem>
          <SelectItem value="hour">hour(s)</SelectItem>
          <SelectItem value="day">day(s)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SortableEmailStep({
  email,
  index,
  emailSteps,
  setEmailSteps,
  handleEditEmail,
  handleDeleteEmail,
  getSenderLabel,
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
          <WaitForControl
            waitTime={email.waitTime}
            waitUnit={email.waitUnit}
            onWaitTimeChange={(value) => {
              const updatedSteps = [...emailSteps];
              updatedSteps[index] = { ...email, waitTime: value };
              setEmailSteps(updatedSteps);
            }}
            onWaitUnitChange={(value) => {
              const updatedSteps = [...emailSteps];
              updatedSteps[index] = { ...email, waitUnit: value };
              setEmailSteps(updatedSteps);
            }}
          />
        </div>
      </Card>

      {/* Connector */}
      <div className="flex justify-center py-1">
        <div className="flex flex-col items-center">
          <div className="w-px h-2 bg-[#999]" />
          {/* <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
          <div className="w-px h-2 bg-[#999]" /> */}
        </div>
      </div>

      {/* Email Card with drag handle */}
      <Card className="group">
        <div className="flex">
          <div
            {...attributes}
            {...listeners}
            className="flex w-10 items-center justify-center border-r cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-1 gap-3 p-4">
            <div className="h-20 w-20 rounded-md border bg-muted/20 flex items-center justify-center text-muted-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    EMAIL {index + 1}
                  </div>
                  <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Email actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditEmail(email)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteEmail(email.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="truncate">
                  <span className="font-medium text-foreground">Subject:</span> {email.subject}
                </div>
                <div className="truncate">
                  <span className="font-medium text-foreground">Sender:</span>{" "}
                  {getSenderLabel(email)}
                </div>
              </div>
            </div>
          </div>
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

  // Workflow state
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isLoadingWorkflowDetails, setIsLoadingWorkflowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

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

  const formatSenderLabel = (sender: Sender) => `${sender.name} <${sender.from}@${sender.domain.name}>`;
  const getSenderLabel = (email: EmailStep) => {
    if (!email.senderId) {
      if (email.senderEmail) {
        return email.senderEmail;
      }
      if (email.senderFrom) {
        return email.senderFrom;
      }
      return "Not set";
    }

    const sender = senders.find((entry) => entry.id === email.senderId);
    if (sender) {
      return formatSenderLabel(sender);
    }

    return email.senderEmail || email.senderFrom || "Not set";
  };


  // Inline title editing
  const [automationTitle, setAutomationTitle] = useState("Untitled Automation");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Email steps
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);
  const [postConditionEmailSteps, setPostConditionEmailSteps] = useState<EmailStep[]>([]);
  const [conditionBranch, setConditionBranch] = useState<ConditionBranch | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<string | null>(null);
  const [emailWaitTime, setEmailWaitTime] = useState(5);
  const [emailWaitUnit, setEmailWaitUnit] = useState("day");
  const [editingEmailSource, setEditingEmailSource] = useState<'main' | 'post' | null>(null);
  const [addEmailBounce, setAddEmailBounce] = useState(false);
  
  // For editing branch emails
  const [editingBranchType, setEditingBranchType] = useState<'yes' | 'no' | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createDragEndHandler = (
    setSteps: React.Dispatch<React.SetStateAction<EmailStep[]>>,
    successMessage: string
  ) => {
    return async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        let reorderedSteps: EmailStep[] = [];

        setSteps((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);

          reorderedSteps = arrayMove(items, oldIndex, newIndex);
          return reorderedSteps;
        });

        // Persist the reordering to the backend
        if (selectedWorkflow && reorderedSteps.length > 0) {
          try {
            // Build a map of email step ID to its new position
            const emailPositionMap = new Map<string, number>();
            reorderedSteps.forEach((emailStep, index) => {
              emailPositionMap.set(emailStep.id, index);
            });

            // Find all workflow steps and group them by email step
            // Each email step may have an associated wait step
            const emailStepGroups = new Map<string, { email: WorkflowStep; wait?: WorkflowStep }>();

            selectedWorkflow.steps.forEach(step => {
              if (step.step_type === 'email') {
                emailStepGroups.set(step.id, { email: step });
              }
            });

            // Associate wait steps with their emails
            const sortedSteps = [...selectedWorkflow.steps].sort((a, b) => a.position - b.position);
            sortedSteps.forEach((step, index) => {
              if (step.step_type === 'wait') {
                // Check if next step is an email
                const nextStep = index < sortedSteps.length - 1 ? sortedSteps[index + 1] : null;
                if (nextStep && nextStep.step_type === 'email') {
                  const group = emailStepGroups.get(nextStep.id);
                  if (group) {
                    group.wait = step;
                  }
                }
              }
            });

            // Build the steps array with updated positions
            const stepsToReorder: Array<{
              id: string;
              position: number;
              parent_step_id: string | null;
              branch: string | null;
            }> = [];

            reorderedSteps.forEach((emailStep, index) => {
              const group = emailStepGroups.get(emailStep.id);
              if (!group) return;

              let currentPosition = (index * 2) + 1;

              // Add wait step first (if exists)
              if (group.wait) {
                stepsToReorder.push({
                  id: group.wait.id,
                  position: currentPosition,
                  parent_step_id: group.wait.parent_step_id,
                  branch: group.wait.branch,
                });
                currentPosition++;
              }

              // Add email step
              stepsToReorder.push({
                id: group.email.id,
                position: currentPosition,
                parent_step_id: group.email.parent_step_id,
                branch: group.email.branch,
              });
            });

            // Call the reorder API
            const response = await api(`/workflows/${selectedWorkflow.id}/steps/reorder`, {
              method: "PUT",
              body: {
                steps: stepsToReorder,
              },
            });

            if (!response.ok) {
              const error = await response.json();
              toast.error(error.detail || "Failed to reorder steps");
              // Revert the local state by refetching workflow
              fetchWorkflowDetails(selectedWorkflow.id);
              return;
            }

            const updatedSteps: WorkflowStep[] = await response.json();

            // Update the selectedWorkflow with new steps
            setSelectedWorkflow({
              ...selectedWorkflow,
              steps: updatedSteps,
            });

            toast.success(successMessage);
          } catch (error) {
            toast.error("Failed to reorder steps");
            // Revert the local state by refetching workflow
            if (selectedWorkflow) {
              fetchWorkflowDetails(selectedWorkflow.id);
            }
          }
        } else {
          toast.success(successMessage);
        }
      }
    };
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleCommit = async (nextTitle: string) => {
    if (!selectedWorkflow || nextTitle === selectedWorkflow.name) {
      return;
    }

    try {
      const response = await api(`/workflows/${selectedWorkflow.id}`, {
        method: "PATCH",
        body: {
          name: nextTitle,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.detail || "Failed to update workflow name");
        setAutomationTitle(selectedWorkflow.name);
        return;
      }

      const updatedWorkflow: Workflow = await response.json();
      setSelectedWorkflow(updatedWorkflow);
      setAutomationTitle(updatedWorkflow.name);
    } catch (error) {
      toast.error("Failed to update workflow name");
      setAutomationTitle(selectedWorkflow.name);
    }
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      await handleTitleCommit(automationTitle);
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      if (selectedWorkflow) {
        setAutomationTitle(selectedWorkflow.name);
      }
    }
  };

  const handleAddEmail = (source: 'main' | 'post') => {
    if (!selectedSegment) {
      toast.warning("Segment should be selected before adding an email.");
      setAddEmailBounce(true);
      window.setTimeout(() => setAddEmailBounce(false), 600);
      return;
    }
    setEditingEmailId(null);
    setEmailSender("");
    setEmailSubject("");
    setEmailContent("");
    setEmailTemplateId(null);
    setEmailWaitTime(5);
    setEmailWaitUnit("day");
    setEditingEmailSource(source);
    setEditingBranchType(null);
    setEmailDialogOpen(true);
  };

  const handleEditEmail = (email: EmailStep, source: 'main' | 'post') => {
    setEditingEmailId(email.id);
    setEmailSender(email.senderId);
    setEmailSubject(email.subject);
    setEmailContent(email.content);
    setEmailTemplateId(email.templateId ?? null);
    setEmailWaitTime(email.waitTime);
    setEmailWaitUnit(email.waitUnit);
    setEditingEmailSource(source);
    setEditingBranchType(null);
    setEmailDialogOpen(true);
  };

  const handleDeleteEmail = (id: string, source: 'main' | 'post') => {
    if (source === 'main') {
      setEmailSteps(emailSteps.filter(e => e.id !== id));
      if (conditionBranch?.targetEmailId === id) {
        setConditionBranch(null);
      }
    } else {
      setPostConditionEmailSteps(postConditionEmailSteps.filter(e => e.id !== id));
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
    if (!selectedSegment) {
      toast.warning("Segment should be selected before adding an email.");
      setAddEmailBounce(true);
      window.setTimeout(() => setAddEmailBounce(false), 600);
      return;
    }
    setEditingEmailId(null);
    setEditingBranchType(branchType);
    setEditingEmailSource(null);
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
    setEditingEmailSource(null);
    setEmailSender(email.senderId);
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

  const handleSaveEmail = async () => {
    if (!emailSender) {
      toast.error("Sender is required");
      return;
    }

    if (!emailTemplateId) {
      toast.error("Email template is required");
      return;
    }

    if (!emailSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }

    const selectedSender = senders.find((sender) => sender.id === emailSender);
    if (!selectedSender) {
      toast.error("Sender is required");
      return;
    }

    const selectedSenderEmail = `${selectedSender.from}@${selectedSender.domain.name}`;

    // Handle branch email
    if (editingBranchType && conditionBranch) {
      const newEmail: EmailStep = {
        id: editingEmailId || crypto.randomUUID(),
        senderId: emailSender,
        senderFrom: selectedSender.from,
        senderEmail: selectedSenderEmail,
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
      if (editingEmailSource === 'post') {
        setPostConditionEmailSteps(postConditionEmailSteps.map(e =>
          e.id === editingEmailId
            ? { ...e, senderId: emailSender, senderFrom: selectedSender.from, senderEmail: selectedSenderEmail, subject: emailSubject, content: emailContent, templateId: emailTemplateId, waitTime: emailWaitTime, waitUnit: emailWaitUnit }
            : e
        ));
      } else {
        setEmailSteps(emailSteps.map(e =>
          e.id === editingEmailId
            ? { ...e, senderId: emailSender, senderFrom: selectedSender.from, senderEmail: selectedSenderEmail, subject: emailSubject, content: emailContent, templateId: emailTemplateId, waitTime: emailWaitTime, waitUnit: emailWaitUnit }
            : e
        ));
      }
      toast.success("Email step updated");
    } else {
      // Adding a new email step - use API for all email steps
      if (!selectedWorkflow) {
        toast.error("No workflow selected");
        return;
      }

      const isMainBranch = editingEmailSource === 'main';
      const currentSteps = isMainBranch ? emailSteps : postConditionEmailSteps;
      const position = currentSteps.length + 1;

      try {
        const response = await api(`/workflows/${selectedWorkflow.id}/steps`, {
          method: "POST",
          body: {
            step_type: "email",
            position,
            parent_step_id: null,
            branch: null,
            sender_id: emailSender,
            template_id: emailTemplateId,
            subject_override: emailSubject,
            content_override: emailContent,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.detail || "Failed to add email step");
          return;
        }

        const createdStep: WorkflowStep = await response.json();
        const createdConfig = createdStep.config ?? {};
        const newEmail: EmailStep = {
          id: createdStep.id,
          senderId: createdConfig.sender_id ?? emailSender,
          senderEmail: createdConfig.sender_email ?? selectedSenderEmail,
          senderFrom: selectedSender.from,
          subject: createdConfig.subject_override ?? emailSubject,
          content: createdConfig.content_override ?? emailContent,
          templateId: createdConfig.template_id ?? emailTemplateId,
          waitTime: emailWaitTime,
          waitUnit: emailWaitUnit,
        };

        if (editingEmailSource === 'post') {
          setPostConditionEmailSteps([...postConditionEmailSteps, newEmail]);
        } else {
          setEmailSteps([...emailSteps, newEmail]);
        }
        toast.success("Email step added");
      } catch (error) {
        toast.error("Failed to add email step");
        return;
      }
    }
    setEditingEmailSource(null);
    setEmailDialogOpen(false);
  };

  // Helper to convert workflow steps to UI email steps
  const convertWorkflowStepsToEmailSteps = (steps: WorkflowStep[]): EmailStep[] => {
    const emailSteps: EmailStep[] = [];
    const sortedSteps = [...steps].sort((a, b) => a.position - b.position);

    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i];
      if (step.step_type === 'email') {
        // Find the wait step before this email (if any)
        const prevStep = i > 0 ? sortedSteps[i - 1] : null;
        const waitTime = prevStep?.step_type === 'wait' ? prevStep.config.wait_duration || 5 : 5;
        const waitUnit = prevStep?.step_type === 'wait' ? prevStep.config.wait_unit || 'day' : 'day';

        emailSteps.push({
          id: step.id,
          senderId: step.config.sender_id || '',
          senderEmail: step.config.sender_email || '',
          subject: step.config.subject_override || '',
          content: step.config.content_override || '',
          templateId: step.config.template_id || null,
          waitTime,
          waitUnit,
        });
      }
    }
    return emailSteps;
  };

  // Populate UI from workflow data
  const populateFromWorkflow = (workflow: Workflow) => {
    setAutomationTitle(workflow.name);
    setSelectedSegment(workflow.trigger_segment?.id || '');
    setSelectedCategory(workflow.unsubscribe_category?.id || '');
    setTrackOpens(workflow.track_opens);
    setTrackClicks(workflow.track_clicks);
    setExitCondition(workflow.exit_on_all_emails ? 'completed' : 'removed');

    // Convert and set email steps
    const convertedSteps = convertWorkflowStepsToEmailSteps(workflow.steps);
    setEmailSteps(convertedSteps);
  };

  // Fetch workflow details by ID
  const fetchWorkflowDetails = async (workflowId: string) => {
    setIsLoadingWorkflowDetails(true);
    try {
      const response = await api(`/workflows/${workflowId}`);
      if (!response.ok) {
        toast.error("Failed to load workflow details");
        return;
      }
      const workflow: Workflow = await response.json();
      setSelectedWorkflow(workflow);
      populateFromWorkflow(workflow);
    } catch (error) {
      toast.error("Failed to load workflow details");
    } finally {
      setIsLoadingWorkflowDetails(false);
    }
  };

  // Fetch all workflows
  const fetchWorkflows = async () => {
    setIsLoadingWorkflows(true);
    try {
      const response = await api("/workflows");
      if (!response.ok) {
        toast.error("Failed to load workflows");
        return;
      }
      const data: WorkflowsResponse = await response.json();
      const workflows = data.data ?? [];
      setWorkflows(workflows);

      // Select first workflow if available
      if (workflows.length > 0) {
        fetchWorkflowDetails(workflows[0].id);
      }
    } catch (error) {
      toast.error("Failed to load workflows");
    } finally {
      setIsLoadingWorkflows(false);
    }
  };

  // Save workflow draft
  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) {
      toast.error("No workflow selected");
      return;
    }

    setIsSaving(true);
    try {
      // First update the workflow settings
      const updateResponse = await api(`/workflows/${selectedWorkflow.id}`, {
        method: "PATCH",
        body: {
          name: automationTitle,
          trigger_segment_id: selectedSegment || undefined,
          unsubscribe_category_id: selectedCategory || undefined,
          track_opens: trackOpens,
          track_clicks: trackClicks,
          exit_on_all_emails: exitCondition === 'completed',
          exit_on_segment_leave: exitCondition === 'removed',
        },
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        toast.error(error.detail || "Failed to update workflow");
        return;
      }

      // Then save as a new version
      const saveResponse = await api(`/workflows/${selectedWorkflow.id}/save`, {
        method: "POST",
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        toast.error(error.detail || "Failed to save workflow version");
        return;
      }

      const updatedWorkflow: Workflow = await saveResponse.json();
      setSelectedWorkflow(updatedWorkflow);
      toast.success("Workflow saved successfully");
    } catch (error) {
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  // Activate workflow
  const handleActivateWorkflow = async () => {
    if (!selectedWorkflow) {
      toast.error("No workflow selected");
      return;
    }

    setIsActivating(true);
    try {
      // First save the workflow
      await handleSaveWorkflow();

      // Then activate it
      const response = await api(`/workflows/${selectedWorkflow.id}/activate?version_number=${selectedWorkflow.draft_version}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.detail || "Failed to activate workflow");
        return;
      }

      const updatedWorkflow: Workflow = await response.json();
      setSelectedWorkflow(updatedWorkflow);
      toast.success("Workflow activated successfully");
    } catch (error) {
      toast.error("Failed to activate workflow");
    } finally {
      setIsActivating(false);
    }
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
    fetchWorkflows();
  }, []);

  // Auto-save workflow when segment is selected
  useEffect(() => {
    const updateWorkflowSegment = async () => {
      if (!selectedWorkflow || !selectedSegment) {
        return;
      }

      // Don't update if the segment hasn't actually changed
      if (selectedWorkflow.trigger_segment?.id === selectedSegment) {
        return;
      }

      try {
        const response = await api(`/workflows/${selectedWorkflow.id}`, {
          method: "PATCH",
          body: {
            trigger_segment_id: selectedSegment,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.detail || "Failed to update workflow segment");
          return;
        }

        const updatedWorkflow: Workflow = await response.json();
        setSelectedWorkflow(updatedWorkflow);
        toast.success("Workflow trigger updated");
      } catch (error) {
        toast.error("Failed to update workflow segment");
      }
    };

    updateWorkflowSegment();
  }, [selectedSegment]);

  const showPostConditionActions = !conditionBranch
    || Boolean(conditionBranch.yesBranch.email || conditionBranch.noBranch.email);

  const handleEmailDragEnd = createDragEndHandler(setEmailSteps, "Email order updated");
  const handlePostConditionDragEnd = createDragEndHandler(setPostConditionEmailSteps, "Post-condition email order updated");

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
              onBlur={async () => {
                setIsEditingTitle(false);
                await handleTitleCommit(automationTitle);
              }}
              onFocus={(e) => e.target.select()}
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
          {isLoadingWorkflows || isLoadingWorkflowDetails ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          ) : selectedWorkflow ? (
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                "h-2 w-2 rounded-full",
                selectedWorkflow.status === 'active' && "bg-green-500",
                selectedWorkflow.status === 'paused' && "bg-yellow-500",
                selectedWorkflow.status === 'draft' && "bg-muted-foreground",
                selectedWorkflow.status === 'archived' && "bg-gray-400"
              )} />
              <span className={cn(
                selectedWorkflow.status === 'active' && "text-green-600",
                selectedWorkflow.status === 'paused' && "text-yellow-600",
                selectedWorkflow.status === 'draft' && "text-muted-foreground",
                selectedWorkflow.status === 'archived' && "text-gray-500"
              )}>
                {selectedWorkflow.status.toUpperCase()}
              </span>
              {selectedWorkflow.has_unsaved_changes && (
                <span className="text-muted-foreground">(unsaved changes)</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              NO WORKFLOW
            </div>
          )}
          <Button
            variant="secondary"
            className="h-9 text-xs"
            onClick={handleSaveWorkflow}
            disabled={isSaving || !selectedWorkflow}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            className="h-9 text-xs"
            onClick={handleActivateWorkflow}
            disabled={isActivating || !selectedWorkflow}
          >
            {isActivating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate"
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Flow Builder */}
        <div className="flex-1 overflow-auto p-8 bg-[radial-gradient(circle,#73737350_1px,transparent_1px)]
bg-[size:10px_10px] relative">
          {isLoadingWorkflowDetails && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading workflow...
              </div>
            </div>
          )}
          <div className="max-w-2xl mx-auto space-y-0">
            {/* Entry Block */}
            <Card className="p-4 max-w-[400px] mx-auto">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3 justify-center">
                <ArrowRight className="h-4 w-4" />
                TRIGGER
              </div>
              <p className="text-sm text-foreground mb-2 flex justify-center items-center">
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
              onDragEnd={handleEmailDragEnd}
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
                    handleEditEmail={(step) => handleEditEmail(step, 'main')}
                    handleDeleteEmail={(id) => handleDeleteEmail(id, 'main')}
                    getSenderLabel={getSenderLabel}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Condition Branch UI - shown after first email if condition exists */}
            {conditionBranch && emailSteps.length > 0 && (
              <div className="relative">
                {/* IF Condition Block */}
                <Card className="p-4 border border-dashed border-primary/50 bg-card">
                  <div className="flex items-center gap-2 mb-3 justify-center">
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
                  <div className="flex items-center gap-2 text-sm text-foreground justify-center">
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
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    {/* Vertical line going down */}
                    <div className="w-px h-4 bg-[#999]" />
                    {/* Horizontal split line with center node and vertical connections */}
                    <div className="flex items-center gap-0">
                      {/* Left horizontal line + node + vertical line */}
                      <div className="flex flex-col items-end">
                        <div className="h-px w-[200px] bg-[#999]" />
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999] -mx-[0.5px]" />
                      {/* Right horizontal line */}
                      <div className="flex flex-col items-start">
                        <div className="h-px w-[200px] bg-[#999]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* YES and NO Branches side by side */}
                <div className="grid grid-cols-2 gap-8">
                  {/* YES Branch */}
                  <div className="flex flex-col items-center">
                    {/* Node connecting horizontal to vertical line */}
                    <div className="h-1.5 w-1.5 rounded-full bg-[#999] -mt-[3px]" />
                    {/* Vertical connector from horizontal line to YES block */}
                    <div className="w-px h-4 bg-[#999]" />

                    <div className="flex flex-col items-center rounded-lg text-card-foreground shadow-sm p-4 w-full border border-dashed border-primary/50 bg-card">
                      <div className="flex items-center gap-2 text-xs font-semibold text-green-600 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        YES
                      </div>
                      <div className="w-px h-4 bg-green-400" />
                    
                    {/* Wait time for YES branch */}
                    <Card className="p-4 w-full max-w-[240px] border-green-200 bg-green-50/50">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground justify-center">
                        <Clock className="h-3 w-3" />
                        <span>Wait</span>
                        <WaitForControl
                          size="compact"
                          waitTime={conditionBranch.yesBranch.waitTime}
                          waitUnit={conditionBranch.yesBranch.waitUnit}
                          onWaitTimeChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            yesBranch: { ...conditionBranch.yesBranch, waitTime: value }
                          })}
                          onWaitUnitChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            yesBranch: { ...conditionBranch.yesBranch, waitUnit: value }
                          })}
                        />
                      </div>
                    </Card>
                    
                    <div className="w-px h-4 bg-green-400" />

                    {/* Email for YES branch */}
                    {conditionBranch.yesBranch.email ? (
                      <>
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
                        {/* Connector after YES branch email */}
                        <div className="w-px h-4 bg-green-400" />
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full max-w-[180px] text-xs h-8 border-green-200 hover:border-green-400",
                            addEmailBounce && "animate-bounce"
                          )}
                          onClick={() => handleAddBranchEmail('yes')}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Email
                        </Button>
                        {/* Connector when no email */}
                        <div className="w-px h-4 bg-green-400" />
                      </>
                    )}
                    </div>
                  </div>

                  {/* NO Branch */}
                  <div className="flex flex-col items-center">
                    {/* Node connecting horizontal to vertical line */}
                    <div className="h-1.5 w-1.5 rounded-full bg-[#999] -mt-[3px]" />
                    {/* Vertical connector from horizontal line to NO block */}
                    <div className="w-px h-4 bg-[#999]" />

                    <div className="flex flex-col items-center rounded-lg text-card-foreground shadow-sm p-4 w-full border border-dashed border-primary/50 bg-card">
                      <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        NO1
                      </div>
                      {/* <div className="w-px h-4 bg-orange-400" /> */}
                    
                    {/* Wait time for NO branch */}
                    <Card className="p-4 w-full max-w-[240px] border-orange-200 bg-orange-50/50">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground justify-center">
                        <Clock className="h-3 w-3" />
                        <span>Wait</span>
                        <WaitForControl
                          size="compact"
                          waitTime={conditionBranch.noBranch.waitTime}
                          waitUnit={conditionBranch.noBranch.waitUnit}
                          onWaitTimeChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            noBranch: { ...conditionBranch.noBranch, waitTime: value }
                          })}
                          onWaitUnitChange={(value) => setConditionBranch({
                            ...conditionBranch,
                            noBranch: { ...conditionBranch.noBranch, waitUnit: value }
                          })}
                        />
                      </div>
                    </Card>
                    
                    {/* <div className="w-px h-4 bg-orange-400" /> */}

                    {/* Email for NO branch */}
                    {conditionBranch.noBranch.email ? (
                      <>
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
                        {/* Connector after NO branch email */}
                        {/* <div className="w-px h-4 bg-orange-400" /> */}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full max-w-[180px] text-xs h-8 border-orange-200 hover:border-orange-400",
                            addEmailBounce && "animate-bounce"
                          )}
                          onClick={() => handleAddBranchEmail('no')}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Email
                        </Button>
                        {/* Connector when no email */}
                        {/* <div className="w-px h-4 bg-orange-400" /> */}
                      </>
                    )}
                    </div>
                  </div>
                </div>

                {/* Merge connector */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    {/* Upper horizontal line with nodes - same pattern as lower */}
                    <div className="flex items-center gap-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                      <div className="w-[200px] h-px bg-[#999] -mx-[0.5px]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                      <div className="w-[200px] h-px bg-[#999] -mx-[0.5px]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                    </div>
                    {/* Vertical lines going down from left and right nodes */}
                    <div className="flex items-center w-[406px] justify-between -mt-[3px]">
                      <div className="w-px h-4 bg-[#999]" />
                      <div className="w-px h-4 bg-[#999]" />
                    </div>
                    {/* Horizontal merge line with center node */}
                    <div className="flex items-center gap-0 -mt-[3px]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                      <div className="w-[200px] h-px bg-[#999] -mx-[0.5px]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                      <div className="w-[200px] h-px bg-[#999] -mx-[0.5px]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#999]" />
                    </div>
                    <div className="w-px h-4 bg-[#999] -mt-[3px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Post-condition email steps */}
            {conditionBranch && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePostConditionDragEnd}
              >
                <SortableContext
                  items={postConditionEmailSteps.map(email => email.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {postConditionEmailSteps.map((email, index) => (
                    <SortableEmailStep
                      key={email.id}
                      email={email}
                      index={index}
                      emailSteps={postConditionEmailSteps}
                      setEmailSteps={setPostConditionEmailSteps}
                      handleEditEmail={(step) => handleEditEmail(step, 'post')}
                      handleDeleteEmail={(id) => handleDeleteEmail(id, 'post')}
                      getSenderLabel={getSenderLabel}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Add Email Block - shown when no condition or after at least one branch email */}
            {showPostConditionActions && (
              <div className="flex justify-center">
                {emailSteps.length > 0 ? (
                  <div className="flex w-full max-w-xs overflow-hidden rounded-md border divide-x divide-border bg-background">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex-1 rounded-none justify-center gap-2 text-sm font-medium",
                        addEmailBounce && "animate-bounce"
                      )}
                      onClick={() => handleAddEmail(conditionBranch ? 'post' : 'main')}
                    >
                      <Mail className="h-4 w-4" />
                      Add Email
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-none justify-center gap-2 text-sm font-medium"
                      onClick={() => handleAddCondition(emailSteps[0].id)}
                    >
                      <GitBranch className="h-4 w-4" />
                      Add Condition
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className={cn(
                      "max-w-xs justify-center gap-2 text-sm font-medium",
                      addEmailBounce && "animate-bounce"
                    )}
                    onClick={() => handleAddEmail('main')}
                  >
                    <Mail className="h-4 w-4" />
                    Add Email
                  </Button>
                )}
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
                            <SelectItem key={sender.id} value={sender.id}>
                              {formatSenderLabel(sender)}
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
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4 justify-center">
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
