import { useState, useRef, useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  previewHtml: string | null;
}

type DeviceMode = "desktop" | "mobile";

export function PreviewPanel({ previewHtml }: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  const width = device === "desktop" ? "100%" : "375px";

  return (
    <div className="flex flex-col h-full">
      {/* Device toggle */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-border gap-1">
        <Button
          variant={device === "desktop" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setDevice("desktop")}
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={device === "mobile" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setDevice("mobile")}
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-auto bg-[#f4f4f5] flex justify-center p-4">
        {previewHtml ? (
          <div
            style={{ width, maxWidth: "100%", transition: "width 0.3s ease" }}
            className="bg-white shadow-sm"
          >
            <iframe
              ref={iframeRef}
              title="Email Preview"
              className="w-full border-0"
              style={{ minHeight: "600px", height: "100%" }}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Email preview will appear here
          </div>
        )}
      </div>
    </div>
  );
}
