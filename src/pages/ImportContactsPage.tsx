import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronLeft, Upload, Check, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface Segment {
  id: string;
  name: string;
}

type Step = "upload" | "map" | "review";

interface ColumnMapping {
  sourceColumn: string;
  sampleData: string[];
  destinationColumn: string;
  include: boolean;
}

interface ParsedContact {
  [key: string]: string;
}

const destinationColumns = [
  { value: "email", label: "email" },
  { value: "first_name", label: "first_name" },
  { value: "last_name", label: "last_name" },
];

export default function ImportContactsPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [parsedData, setParsedData] = useState<ParsedContact[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [isCheckingExistence, setIsCheckingExistence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const response = await api("/segments");
        if (response.ok) {
          const data = await response.json();
          setSegments(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch segments:", error);
      }
    };
    fetchSegments();
  }, []);

  const steps: { key: Step; label: string; number: number }[] = [
    { key: "upload", label: "Upload", number: 1 },
    { key: "map", label: "Map Columns", number: 2 },
    { key: "review", label: "Review", number: 3 },
  ];

  const getStepStatus = (stepKey: Step) => {
    const stepOrder = ["upload", "map", "review"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a CSV file");
      }
    }
  };

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    const rows = lines.slice(1).map(line => 
      line.split(",").map(cell => cell.trim().replace(/^["']|["']$/g, ""))
    );
    return { headers, rows };
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // Create column mappings with sample data
    const mappings: ColumnMapping[] = headers.map((header, index) => {
      const sampleData = rows.slice(0, 3).map(row => row[index] || "");
      const lowerHeader = header.toLowerCase();
      
      // Auto-detect destination column
      let destinationColumn = "skip";
      if (lowerHeader.includes("email")) destinationColumn = "email";
      else if (lowerHeader.includes("first") && lowerHeader.includes("name")) destinationColumn = "first_name";
      else if (lowerHeader.includes("last") && lowerHeader.includes("name")) destinationColumn = "last_name";
      else if (lowerHeader === "first_name" || lowerHeader === "firstname") destinationColumn = "first_name";
      else if (lowerHeader === "last_name" || lowerHeader === "lastname") destinationColumn = "last_name";
      // else if (lowerHeader.includes("phone")) destinationColumn = "phone";
      // else if (lowerHeader.includes("company")) destinationColumn = "company";

      return {
        sourceColumn: header,
        sampleData,
        destinationColumn,
        include: destinationColumn !== "skip",
      };
    });

    setColumnMappings(mappings);

    // Parse all data for review
    const contacts: ParsedContact[] = rows.map(row => {
      const contact: ParsedContact = {};
      headers.forEach((header, index) => {
        contact[header] = row[index] || "";
      });
      return contact;
    });
    setParsedData(contacts);

    setCurrentStep("map");
  };

  const updateMapping = (index: number, field: keyof ColumnMapping, value: string | boolean) => {
    setColumnMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    ));
  };

  const handleContinueToReview = async () => {
    const hasEmailMapping = columnMappings.some(
      m => m.destinationColumn === "email" && m.include
    );
    
    if (!hasEmailMapping) {
      toast.error("Please map at least one column to 'email'");
      return;
    }

    // Check email existence
    setIsCheckingExistence(true);
    try {
      const reviewData = getReviewData();
      const emails = reviewData.map(c => c.email).filter(Boolean);
      
      if (emails.length > 0) {
        const response = await api("/contacts/existence", {
          method: "POST",
          body: { emails },
        });
        
        if (response.ok) {
          const data = await response.json();
          const existing = new Set<string>(
            data.filter((item: { email: string; exists: boolean }) => item.exists)
              .map((item: { email: string }) => item.email.toLowerCase())
          );
          setExistingEmails(existing);
        }
      }
    } catch (error) {
      console.error("Failed to check email existence:", error);
    } finally {
      setIsCheckingExistence(false);
    }
    
    setCurrentStep("review");
  };

  const handleImport = async () => {
    const reviewData = getReviewData();
    
    // Filter out existing emails
    const newContacts = reviewData.filter(
      contact => !existingEmails.has(contact.email?.toLowerCase())
    );
    
    if (newContacts.length === 0) {
      toast.error("All contacts already exist");
      return;
    }
    
    // Build rows for the API
    const rows = newContacts.map(contact => ({
      email: contact.email,
      first_name: contact.first_name || undefined,
      last_name: contact.last_name || undefined,
      status: "subscribed",
    }));

    const requestBody: {
      rows: typeof rows;
      segment_ids?: string[];
      default_status: string;
    } = {
      rows,
      default_status: "subscribed",
    };

    if (selectedSegment && selectedSegment !== "none") {
      requestBody.segment_ids = [selectedSegment];
    }

    setIsImporting(true);
    try {
      const response = await api("/contacts/import", {
        method: "POST",
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to import contacts");
        return;
      }

      const segmentLabel = selectedSegment && selectedSegment !== "none" 
        ? segments.find(s => s.id === selectedSegment)?.name 
        : null;
      
      const message = segmentLabel
        ? `Successfully imported ${newContacts.length} contacts to ${segmentLabel}`
        : `Successfully imported ${newContacts.length} contacts`;
      
      toast.success(message);
      navigate("/audience");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import contacts");
    } finally {
      setIsImporting(false);
    }
  };

  const getReviewData = () => {
    const includedMappings = columnMappings.filter(m => m.include && m.destinationColumn !== "skip");
    
    return parsedData.map(contact => {
      const mappedContact: Record<string, string> = {};
      includedMappings.forEach(mapping => {
        mappedContact[mapping.destinationColumn] = contact[mapping.sourceColumn] || "";
      });
      return mappedContact;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/audience")}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-medium">Adding contacts</h1>
        <div className="w-8" />
      </header>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4 py-8">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium",
                    status === "completed" && "border-foreground bg-foreground text-background",
                    status === "current" && "border-foreground bg-foreground text-background",
                    status === "upcoming" && "border-border text-muted-foreground"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-px w-12 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 pb-24">
        {currentStep === "upload" && (
          <Card>
            <CardContent className="p-8">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload
                  className={cn(
                    "h-10 w-10 mx-auto mb-4",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {file ? (
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to choose a different file
                    </p>
                  </div>
                ) : isDragging ? (
                  <p className="text-sm font-medium text-primary">
                    Drop your CSV file here
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV files only
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "map" && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase text-xs">
                    <TableHead className="w-[200px] h-10">Your File Column</TableHead>
                    <TableHead className="w-[300px] h-10">Your Sample Data</TableHead>
                    <TableHead className="w-[200px] h-10">Destination Column</TableHead>
                    <TableHead className="w-[80px] h-10 text-center">Include</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnMappings.map((mapping, index) => (
                    <TableRow key={mapping.sourceColumn}>
                      <TableCell className="font-medium px-4 py-2">
                        {mapping.sourceColumn}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <div className="flex gap-2">
                          {mapping.sampleData.map((sample, i) => (
                            <span
                              key={i}
                              className="rounded bg-muted px-2 py-1 text-xs font-mono truncate max-w-[100px]"
                            >
                              {sample || "—"}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Select
                          value={mapping.destinationColumn}
                          onValueChange={(value) => updateMapping(index, "destinationColumn", value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationColumns.map((col) => (
                              <SelectItem key={col.value} value={col.value}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center px-4 py-2">
                        <Checkbox
                          checked={mapping.include}
                          onCheckedChange={(checked) =>
                            updateMapping(index, "include", !!checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {currentStep === "review" && (
          <div className="space-y-4">
            {/* Segment Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Assign to Segment</Label>
                      <p className="text-xs text-muted-foreground">
                        Optionally add all imported contacts to a segment
                      </p>
                    </div>
                  </div>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No segment</SelectItem>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {getReviewData().filter(c => !existingEmails.has(c.email?.toLowerCase())).length}
                    </span> contacts will be imported
                    {existingEmails.size > 0 && (
                      <span className="text-destructive ml-2">
                        (<span className="font-medium">{existingEmails.size}</span> will be skipped)
                      </span>
                    )}
                    {selectedSegment && selectedSegment !== "none" && (
                      <span> to <span className="font-medium text-foreground">{segments.find(s => s.id === selectedSegment)?.name}</span></span>
                    )}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnMappings
                        .filter((m) => m.include && m.destinationColumn !== "skip")
                        .map((mapping) => (
                          <TableHead key={mapping.destinationColumn}>
                            {mapping.destinationColumn}
                          </TableHead>
                        ))}
                        <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getReviewData()
                    .slice(0, 10)
                    .map((contact, index) => {
                      const isExisting = existingEmails.has(contact.email?.toLowerCase());
                      return (
                        <TableRow 
                          key={index} 
                          className={cn(isExisting && "bg-destructive/5")}
                        >
                          {columnMappings
                            .filter((m) => m.include && m.destinationColumn !== "skip")
                            .map((mapping) => (
                              <TableCell 
                                key={mapping.destinationColumn}
                                className={cn(isExisting && "text-muted-foreground")}
                              >
                                {contact[mapping.destinationColumn] || "—"}
                              </TableCell>
                            ))}
                          <TableCell>
                            {isExisting && (
                              <div className="flex items-center gap-1 text-destructive text-xs">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Exists</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              {parsedData.length > 10 && (
                <div className="p-4 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {parsedData.length} contacts
                  </p>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-background px-6 py-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep === "upload") {
              navigate("/audience");
            } else if (currentStep === "map") {
              setCurrentStep("upload");
            } else {
              setCurrentStep("map");
            }
          }}
        >
          {currentStep === "upload" ? "Cancel" : "Back"}
        </Button>
        <Button className="h-9"
          onClick={() => {
            if (currentStep === "upload") {
              handleFileUpload();
            } else if (currentStep === "map") {
              handleContinueToReview();
            } else {
              handleImport();
            }
          }}
          disabled={(currentStep === "upload" && !file) || isImporting || isCheckingExistence}
        >
          {isImporting ? "Importing..." : isCheckingExistence ? "Checking..." : currentStep === "review" ? "Import contacts" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}
