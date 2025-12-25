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
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Users, UserCheck, UserMinus, Download, Upload, UserPlus, ChevronDown, Code, BookOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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

const mockContacts = [
  { id: "1", email: "john@example.com", status: "subscribed" as const, segment: "General", added: "2 days ago" },
  { id: "2", email: "sarah@startup.io", status: "subscribed" as const, segment: "VIP", added: "1 week ago" },
  { id: "3", email: "dev@company.com", status: "unsubscribed" as const, segment: "General", added: "2 weeks ago" },
  { id: "4", email: "marketing@brand.co", status: "subscribed" as const, segment: "Newsletter", added: "1 month ago" },
];

const mockSegments = [
  { id: "1", name: "General", contacts: 3, created: "System default" },
  { id: "2", name: "VIP", contacts: 1, created: "1 week ago" },
  { id: "3", name: "Newsletter", contacts: 1, created: "1 month ago" },
];

export default function AudiencePage() {
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmails, setNewEmails] = useState("");
  const [isAPIOpen, setIsAPIOpen] = useState(false);
  const navigate = useNavigate();

  // Segment management state
  const [segments, setSegments] = useState(mockSegments);
  const [isAddSegmentOpen, setIsAddSegmentOpen] = useState(false);
  const [isEditSegmentOpen, setIsEditSegmentOpen] = useState(false);
  const [isDeleteSegmentOpen, setIsDeleteSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<typeof mockSegments[0] | null>(null);

  const handleAddSegment = () => {
    if (!segmentName.trim()) return;
    const newSegment = {
      id: Date.now().toString(),
      name: segmentName.trim(),
      contacts: 0,
      created: "Just now",
    };
    setSegments([...segments, newSegment]);
    setSegmentName("");
    setIsAddSegmentOpen(false);
  };

  const handleEditSegment = () => {
    if (!segmentName.trim() || !selectedSegment) return;
    setSegments(segments.map(s => 
      s.id === selectedSegment.id ? { ...s, name: segmentName.trim() } : s
    ));
    setSegmentName("");
    setSelectedSegment(null);
    setIsEditSegmentOpen(false);
  };

  const handleDeleteSegment = () => {
    if (!selectedSegment) return;
    setSegments(segments.filter(s => s.id !== selectedSegment.id));
    setSelectedSegment(null);
    setIsDeleteSegmentOpen(false);
  };

  const openEditDialog = (segment: typeof mockSegments[0]) => {
    setSelectedSegment(segment);
    setSegmentName(segment.name);
    setIsEditSegmentOpen(true);
  };

  const openDeleteDialog = (segment: typeof mockSegments[0]) => {
    setSelectedSegment(segment);
    setIsDeleteSegmentOpen(true);
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
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">4</p>
                      <p className="text-sm text-muted-foreground">All contacts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <UserCheck className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-muted-foreground">Subscribers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <UserMinus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">1</p>
                      <p className="text-sm text-muted-foreground">Unsubscribers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
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
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContacts.map((contact) => (
                    <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{contact.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={contact.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.segment}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.added}</TableCell>
                    </TableRow>
                  ))}
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
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="font-medium">{segment.name}</TableCell>
                      <TableCell>{segment.contacts}</TableCell>
                      <TableCell className="text-muted-foreground">{segment.created}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Product Updates</TableCell>
                    <TableCell>Opt-in</TableCell>
                    <TableCell>Public</TableCell>
                    <TableCell className="text-muted-foreground">2 weeks ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Marketing</TableCell>
                    <TableCell>Opt-out</TableCell>
                    <TableCell>Public</TableCell>
                    <TableCell className="text-muted-foreground">1 month ago</TableCell>
                  </TableRow>
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
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
            <Button variant="outline" onClick={() => { setIsAddSegmentOpen(false); setSegmentName(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAddSegment} disabled={!segmentName.trim()}>
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
            <div className="space-y-2">
              <Label htmlFor="edit-segment-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-segment-name"
                placeholder="e.g. VIP Customers"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditSegmentOpen(false); setSegmentName(""); setSelectedSegment(null); }}>
              Cancel
            </Button>
            <Button onClick={handleEditSegment} disabled={!segmentName.trim()}>
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

      <ContactsAPISection isOpen={isAPIOpen} onClose={() => setIsAPIOpen(false)} />
    </>
  );
}
