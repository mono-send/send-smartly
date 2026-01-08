import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function AddDomainPage() {
  const navigate = useNavigate();
  const [newDomain, setNewDomain] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("us-east-1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getErrorMessage = async (response: Response) => {
    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        return data.detail;
      }

      if (Array.isArray(data?.detail)) {
        const detailMessage = data.detail.find((item: { msg?: string; message?: string }) =>
          item?.msg || item?.message,
        );
        if (detailMessage?.msg) {
          return detailMessage.msg;
        }
        if (detailMessage?.message) {
          return detailMessage.message;
        }
      }

      if (typeof data?.message === "string") {
        return data.message;
      }
    } catch (error) {
      console.error("Failed to parse error response:", error);
    }

    return "Failed to add domain";
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api("/domains", {
        method: "POST",
        body: { domain: newDomain, region: selectedRegion },
      });

      if (response.ok) {
        toast.success("Domain added successfully");
        navigate("/domains");
      } else {
        const message = await getErrorMessage(response);
        toast.error(message);
      }
    } catch (error: any) {
      if (error.message !== "Unauthorized") {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopBar 
        title="Add domain" 
        subtitle="Configure a new sending domain"
      />
      
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Domain details</CardTitle>
            <CardDescription>
              Add a new domain to start sending emails. You'll need to configure DNS records to verify ownership.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain name</Label>
              <Input
                id="domain"
                placeholder="mail.example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-south-1">Asia Pacific (Mumbai)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/domains")} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add domain"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
