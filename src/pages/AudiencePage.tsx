import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { Search, Plus, Users, UserCheck, UserMinus, Download, Upload, UserPlus, ChevronDown, Code, BookOpen, MoreVertical, Pencil, Trash2, Loader2, AlertTriangle, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContactsAPISection } from "@/components/ContactsAPISection";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: "subscribed" | "unsubscribed" | "bounced" | "complained";
  metadata: unknown;
  created_at: string;
  categories: Array<{ id: string; name: string }>;
  segments: Array<{ id: string; name: string }>;
}

interface ContactStats {
  all: number;
  subscribed: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  visibility: string;
  created_at: string;
}

export default function AudiencePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmails, setNewEmails] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [isAddingContacts, setIsAddingContacts] = useState(false);
  const [isAPIOpen, setIsAPIOpen] = useState(false);
  const navigate = useNavigate();

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Segment management state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [isAddSegmentOpen, setIsAddSegmentOpen] = useState(false);
  const [isEditSegmentOpen, setIsEditSegmentOpen] = useState(false);
  const [isDeleteSegmentOpen, setIsDeleteSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSegment, setIsLoadingSegment] = useState(false);

  // Category management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryVisibility, setCategoryVisibility] = useState("private");
  const [categoryType, setCategoryType] = useState("custom");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  // Contact edit/delete state
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isDeleteContactOpen, setIsDeleteContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editContactFirstName, setEditContactFirstName] = useState("");
  const [editContactLastName, setEditContactLastName] = useState("");
  const [editContactStatus, setEditContactStatus] = useState<"subscribed" | "unsubscribed" | "bounced" | "complained">("subscribed");
  const [editContactSegmentIds, setEditContactSegmentIds] = useState<string[]>([]);
  const [editContactCategoryIds, setEditContactCategoryIds] = useState<string[]>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchSegments();
    fetchCategories();
    fetchContactStats();
  }, []);

  // Fetch contacts when filters change
  useEffect(() => {
    fetchContacts();
  }, [search, statusFilter, segmentFilter]);

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (segmentFilter !== "all") params.append("segment_id", segmentFilter);
      if (search.trim()) params.append("search", search.trim());

      const queryString = params.toString();
      const endpoint = queryString ? `/contacts?${queryString}` : "/contacts";

      const response = await api(endpoint);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.items || []);
      } else {
        toast.error("Failed to load contacts");
      }
    } catch (error) {
      toast.error("Failed to load contacts");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchContactStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await api("/contacts/stats");
      if (response.ok) {
        const data = await response.json();
        setContactStats(data);
      }
    } catch (error) {
      console.error("Failed to load contact stats");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAddContacts = async () => {
    if (!newEmails.trim()) return;
    setIsAddingContacts(true);
    try {
      const emailList = newEmails
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e);

      const body: { emails: string[]; segment_ids?: string[] } = { emails: emailList };
      if (selectedSegmentId) {
        body.segment_ids = [selectedSegmentId];
      }

      const response = await api("/contacts", {
        method: "POST",
        body,
      });
      if (response.ok) {
        toast.success("Contacts added successfully");
        setNewEmails("");
        setSelectedSegmentId("");
        setIsAddDialogOpen(false);
        fetchContacts();
        fetchContactStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to add contacts");
      }
    } catch (error) {
      toast.error("Failed to add contacts");
    } finally {
      setIsAddingContacts(false);
    }
  };

  const fetchSegments = async () => {
    setIsLoadingSegments(true);
    try {
      const response = await api("/segments");
      if (response.ok) {
        const data = await response.json();
        setSegments(data.items || []);
      } else {
        toast.error("Failed to load segments");
      }
    } catch (error) {
      toast.error("Failed to load segments");
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const handleAddSegment = async () => {
    if (!segmentName.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await api("/segments", {
        method: "POST",
        body: { name: segmentName.trim() },
      });
      if (response.ok) {
        const newSegment = await response.json();
        setSegments([...segments, newSegment]);
        setSegmentName("");
        setIsAddSegmentOpen(false);
        toast.success("Segment created successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to create segment");
      }
    } catch (error) {
      toast.error("Failed to create segment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSegment = async () => {
    if (!segmentName.trim() || !selectedSegment) return;
    setIsSubmitting(true);
    try {
      const response = await api(`/segments/${selectedSegment.id}`, {
        method: "PUT",
        body: { name: segmentName.trim() },
      });
      if (response.ok) {
        const updatedSegment = await response.json();
        setSegments(segments.map(s =>
          s.id === selectedSegment.id ? updatedSegment : s
        ));
        setSegmentName("");
        setSegmentDescription("");
        setSelectedSegment(null);
        setIsEditSegmentOpen(false);
        toast.success("Segment updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update segment");
      }
    } catch (error) {
      toast.error("Failed to update segment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;
    setIsSubmitting(true);
    try {
      const response = await api(`/segments/${selectedSegment.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSegments(segments.filter(s => s.id !== selectedSegment.id));
        setSelectedSegment(null);
        setIsDeleteSegmentOpen(false);
        toast.success("Segment deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete segment");
      }
    } catch (error) {
      toast.error("Failed to delete segment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = async (segment: Segment) => {
    setSelectedSegment(segment);
    setIsEditSegmentOpen(true);
    setIsLoadingSegment(true);
    try {
      const response = await api(`/segments/${segment.id}`);
      if (response.ok) {
        const data = await response.json();
        setSegmentName(data.name);
        setSegmentDescription(data.description || "");
      } else {
        setSegmentName(segment.name);
        toast.error("Failed to load segment details");
      }
    } catch (error) {
      setSegmentName(segment.name);
      toast.error("Failed to load segment details");
    } finally {
      setIsLoadingSegment(false);
    }
  };

  const openDeleteDialog = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsDeleteSegmentOpen(true);
  };

  // Category API functions
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await api("/contact-categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.items || []);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;
    setIsCategorySubmitting(true);
    try {
      const response = await api("/contact-categories", {
        method: "POST",
        body: {
          name: categoryName.trim(),
          type: categoryType,
          visibility: categoryVisibility
        },
      });
      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setCategoryName("");
        setCategoryVisibility("private");
        setCategoryType("custom");
        setIsAddCategoryOpen(false);
        toast.success("Category created successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to create category");
      }
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !selectedCategory) return;
    setIsCategorySubmitting(true);
    try {
      const response = await api(`/contact-categories/${selectedCategory.id}`, {
        method: "PUT",
        body: {
          name: categoryName.trim(),
          visibility: categoryVisibility
        },
      });
      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(categories.map(c =>
          c.id === selectedCategory.id ? updatedCategory : c
        ));
        resetCategoryForm();
        setIsEditCategoryOpen(false);
        toast.success("Category updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update category");
      }
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setIsCategorySubmitting(true);
    try {
      const response = await api(`/contact-categories/${selectedCategory.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCategories(categories.filter(c => c.id !== selectedCategory.id));
        setSelectedCategory(null);
        setIsDeleteCategoryOpen(false);
        toast.success("Category deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const openEditCategoryDialog = async (category: Category) => {
    setSelectedCategory(category);
    setIsEditCategoryOpen(true);
    setIsLoadingCategory(true);
    try {
      const response = await api(`/contact-categories/${category.id}`);
      if (response.ok) {
        const data = await response.json();
        setCategoryName(data.name);
        setCategoryType(data.type);
        setCategoryVisibility(data.visibility);
      } else {
        setCategoryName(category.name);
        setCategoryType(category.type);
        setCategoryVisibility(category.visibility);
        toast.error("Failed to load category details");
      }
    } catch (error) {
      setCategoryName(category.name);
      setCategoryType(category.type);
      setCategoryVisibility(category.visibility);
      toast.error("Failed to load category details");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const openDeleteCategoryDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteCategoryOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryVisibility("private");
    setCategoryType("custom");
    setSelectedCategory(null);
  };

  // Contact edit/delete functions
  const openEditContactDialog = async (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditContactOpen(true);
    setIsLoadingContact(true);
    try {
      const response = await api(`/contacts/${contact.id}`);
      if (response.ok) {
        const data = await response.json();
        setEditContactEmail(data.email);
        setEditContactFirstName(data.first_name || "");
        setEditContactLastName(data.last_name || "");
        setEditContactStatus(data.status);
        setEditContactSegmentIds(data.segments?.map((s: { id: string }) => s.id) || []);
        setEditContactCategoryIds(data.categories?.map((c: { id: string }) => c.id) || []);
      } else {
        // Fallback to contact from list
        setEditContactEmail(contact.email);
        setEditContactFirstName(contact.first_name || "");
        setEditContactLastName(contact.last_name || "");
        setEditContactStatus(contact.status);
        setEditContactSegmentIds(contact.segments?.map(s => s.id) || []);
        setEditContactCategoryIds(contact.categories?.map(c => c.id) || []);
        toast.error("Failed to load contact details");
      }
    } catch (error) {
      setEditContactEmail(contact.email);
      setEditContactFirstName(contact.first_name || "");
      setEditContactLastName(contact.last_name || "");
      setEditContactStatus(contact.status);
      setEditContactSegmentIds(contact.segments?.map(s => s.id) || []);
      setEditContactCategoryIds(contact.categories?.map(c => c.id) || []);
      toast.error("Failed to load contact details");
    } finally {
      setIsLoadingContact(false);
    }
  };

  const openDeleteContactDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteContactOpen(true);
  };

  const handleEditContact = async () => {
    if (!selectedContact || !editContactEmail.trim()) return;
    setIsContactSubmitting(true);
    try {
      const response = await api(`/contacts/${selectedContact.id}`, {
        method: "PUT",
        body: {
          email: editContactEmail.trim(),
          first_name: editContactFirstName.trim() || null,
          last_name: editContactLastName.trim() || null,
          status: editContactStatus,
          segment_ids: editContactSegmentIds,
          category_ids: editContactCategoryIds,
        },
      });
      if (response.ok) {
        toast.success("Contact updated successfully");
        setIsEditContactOpen(false);
        resetContactForm();
        fetchContacts();
        fetchContactStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to update contact");
      }
    } catch (error) {
      toast.error("Failed to update contact");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    setIsContactSubmitting(true);
    try {
      const response = await api(`/contacts/${selectedContact.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Contact deleted successfully");
        setIsDeleteContactOpen(false);
        setSelectedContact(null);
        fetchContacts();
        fetchContactStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to delete contact");
      }
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const resetContactForm = () => {
    setSelectedContact(null);
    setEditContactEmail("");
    setEditContactFirstName("");
    setEditContactLastName("");
    setEditContactStatus("subscribed");
    setEditContactSegmentIds([]);
    setEditContactCategoryIds([]);
  };

  const toggleSegmentSelection = (segmentId: string) => {
    setEditContactSegmentIds(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const toggleCategorySelection = (categoryId: string) => {
    setEditContactCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <>
      <TopBar
        title="Audience"
        subtitle="Manage contacts, segments, and subscriptions"
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsAPIOpen(true)}>
            <Code className="h-4 w-4" />
            API
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Docs
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add contacts
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add manually
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/audience/import")}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TopBar>

      <div className="p-6">
        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="categories">Unsubscribe Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            {/* Metrics */}
            <div className="grid overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm md:grid-cols-5 md:divide-x">
              <div className="border-b md:border-b-0">
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-semibold">{contactStats?.all ?? 0}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground text-center">All contacts</p>
                </CardContent>
              </div>
              <div className="border-b md:border-b-0">
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <UserCheck className="h-5 w-5 text-success" />
                    </div>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-semibold">{contactStats?.subscribed ?? 0}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground text-center">Subscribers</p>
                </CardContent>
              </div>
              <div className="border-b md:border-b-0">
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <UserMinus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-semibold">{contactStats?.unsubscribed ?? 0}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground text-center">Unsubscribers</p>
                </CardContent>
              </div>
              <div className="border-b md:border-b-0">
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-semibold">{contactStats?.bounced ?? 0}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground text-center">Bounced</p>
                </CardContent>
              </div>
              <div>
                <CardContent className="flex flex-col items-center gap-4 py-6">
                  <div className="flex items-center gap-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                      <Ban className="h-5 w-5 text-destructive" />
                    </div>
                    {isLoadingStats ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-3xl font-semibold">{contactStats?.complained ?? 0}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground text-center">Complained</p>
                </CardContent>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white hover:border-stone-300 focus-within:border-stone-300 focus-within:shadow-input hover:shadow-input-hover focus-within:shadow-input focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complained">Complained</SelectItem>
                </SelectContent>
              </Select>

              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase text-xs">
                    <TableHead className="h-10">Email</TableHead>
                    <TableHead className="h-10">Status</TableHead>
                    <TableHead className="h-10">Segment</TableHead>
                    <TableHead className="h-10">Added</TableHead>
                    <TableHead className="w-[50px] h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingContacts ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-4 py-2"><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="px-4 py-2"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="px-4 py-2"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="px-4 py-2"><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No contacts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/audience/contacts/${contact.id}`)}
                      >
                        <TableCell className="px-4 py-2 font-medium">{contact.email}</TableCell>
                        <TableCell className="px-4 py-2">
                          <StatusBadge status={contact.status} />
                        </TableCell>
                        <TableCell className="px-4 py-2 text-muted-foreground">
                          {contact.segments.length > 0 ? contact.segments.map(s => s.name).join(", ") : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(contact.created_at)}</TableCell>
                        <TableCell className="px-4 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openEditContactDialog(contact);
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteContactDialog(contact);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="properties">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No custom properties yet. Add properties to personalize your emails.</p>
              <Button className="mt-4">Add property</Button>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => setIsAddSegmentOpen(true)}>
                <Plus className="h-4 w-4" />
                Add segment
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase text-xs">
                    <TableHead className="h-10">Name</TableHead>
                    <TableHead className="h-10">Created</TableHead>
                    <TableHead className="w-[50px] h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSegments ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : segments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No segments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    segments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="px-4 py-2 font-medium">{segment.name}</TableCell>
                        <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(segment.created_at)}</TableCell>
                        <TableCell className="px-4 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(segment)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(segment)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="h-4 w-4" />
                Add category
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase text-xs">
                    <TableHead className="h-10">Name</TableHead>
                    <TableHead className="h-10">Type</TableHead>
                    <TableHead className="h-10">Visibility</TableHead>
                    <TableHead className="h-10">Created</TableHead>
                    <TableHead className="w-[50px] h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCategories ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No categories yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="px-4 py-2 font-medium">{category.name}</TableCell>
                        <TableCell className="px-4 py-2 capitalize">{category.type}</TableCell>
                        <TableCell className="px-4 py-2 capitalize">{category.visibility}</TableCell>
                        <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(category.created_at)}</TableCell>
                        <TableCell className="px-4 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteCategoryDialog(category)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Contacts Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add contacts</DialogTitle>
            <DialogDescription>
              Add email addresses separated by commas or new lines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email addresses</Label>
              <Textarea
                id="emails"
                placeholder="john@example.com, sarah@startup.io"
                value={newEmails}
                onChange={(e) => setNewEmails(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Segment (optional)</Label>
              <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setNewEmails("");
              setSelectedSegmentId("");
            }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddContacts} disabled={!newEmails.trim() || isAddingContacts}>
              {isAddingContacts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Segment Dialog */}
      <Dialog open={isAddSegmentOpen} onOpenChange={setIsAddSegmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add segment</DialogTitle>
            <DialogDescription>
              Create a new segment to organize your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="segment-name"
                placeholder="e.g. VIP Customers"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => { setIsAddSegmentOpen(false); setSegmentName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddSegment} disabled={!segmentName.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Segment Dialog */}
      <Dialog open={isEditSegmentOpen} onOpenChange={setIsEditSegmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit segment</DialogTitle>
            <DialogDescription>
              Update the segment name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingSegment ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-segment-name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-segment-name"
                  placeholder="e.g. VIP Customers"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => { setIsEditSegmentOpen(false); setSegmentName(""); setSegmentDescription(""); setSelectedSegment(null); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditSegment} disabled={!segmentName.trim() || isSubmitting || isLoadingSegment}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Segment Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteSegmentOpen}
        onOpenChange={setIsDeleteSegmentOpen}
        title="Delete segment"
        description={`Are you sure you want to delete "${selectedSegment?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteSegment}
      />

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={(open) => {
        setIsAddCategoryOpen(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing your contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={categoryVisibility} onValueChange={setCategoryVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={categoryType} onValueChange={setCategoryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System (Default)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!categoryName.trim() || isCategorySubmitting}
            >
              {isCategorySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingCategory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-category-name"
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={categoryVisibility} onValueChange={setCategoryVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => { setIsEditCategoryOpen(false); resetCategoryForm(); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditCategory} disabled={!categoryName.trim() || isCategorySubmitting || isLoadingCategory}>
              {isCategorySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteCategoryOpen}
        onOpenChange={setIsDeleteCategoryOpen}
        title="Delete category"
        description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCategory}
      />

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactOpen} onOpenChange={(open) => {
        setIsEditContactOpen(open);
        if (!open) resetContactForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingContact ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Segments</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer">
                        {editContactSegmentIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {editContactSegmentIds.map(id => {
                              const segment = segments.find(s => s.id === id);
                              return segment ? (
                                <Badge key={id} variant="secondary" className="gap-1">
                                  {segment.name}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSegmentSelection(id);
                                    }}
                                  />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Optionally add to existing segments...</span>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {segments.map((segment) => (
                        <DropdownMenuItem
                          key={segment.id}
                          onClick={() => toggleSegmentSelection(segment.id)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${editContactSegmentIds.includes(segment.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                            {editContactSegmentIds.includes(segment.id) && (
                              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          {segment.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer">
                        {editContactCategoryIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {editContactCategoryIds.map(id => {
                              const category = categories.find(c => c.id === id);
                              return category ? (
                                <Badge key={id} variant="secondary" className="gap-1">
                                  {category.name}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCategorySelection(id);
                                    }}
                                  />
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Optionally add to categories...</span>
                        )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {categories.map((category) => (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => toggleCategorySelection(category.id)}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${editContactCategoryIds.includes(category.id) ? 'bg-primary border-primary' : 'border-input'}`}>
                            {editContactCategoryIds.includes(category.id) && (
                              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                  <Label>Subscribed</Label>
                  <Switch
                    checked={editContactStatus === "subscribed"}
                    onCheckedChange={(checked) => setEditContactStatus(checked ? "subscribed" : "unsubscribed")}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input
                      value={editContactFirstName}
                      onChange={(e) => setEditContactFirstName(e.target.value)}
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input
                      value={editContactLastName}
                      onChange={(e) => setEditContactLastName(e.target.value)}
                      className="bg-muted"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => { setIsEditContactOpen(false); resetContactForm(); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditContact} disabled={!editContactEmail.trim() || isContactSubmitting || isLoadingContact}>
              {isContactSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteContactOpen}
        onOpenChange={setIsDeleteContactOpen}
        title="Delete contact"
        description={`Are you sure you want to delete "${selectedContact?.email}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteContact}
        isLoading={isContactSubmitting}
      />

      <ContactsAPISection isOpen={isAPIOpen} onClose={() => setIsAPIOpen(false)} />
    </>
  );
}
