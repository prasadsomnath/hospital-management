import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { receptionApi } from "@/lib/reception-api";
import type { PatientRequest } from "@/lib/reception-types";
import { useAuthStore } from "@/store/auth-store";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedPatient {
  data: PatientRequest;
  isValid: boolean;
  errors: string[];
}

// Dynamically load PDF.js from CDN to avoid bundle configuration errors in Electron/Vite
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    let script = document.querySelector(
      'script[src*="pdf.min.js"]',
    ) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if ((window as any).pdfjsLib) {
        clearInterval(checkInterval);
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(pdfjs);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (!(window as any).pdfjsLib) {
        reject(
          new Error("Timeout loading PDF parser. Check internet connection."),
        );
      }
    }, 10000);
  });
};

export function BulkImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [inputText, setInputText] = useState("");
  const [parsedPatients, setParsedPatients] = useState<ParsedPatient[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const hospitalCode = user?.hospitalCode || "HSP001";

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setInputText("");
      setParsedPatients([]);
      setActiveTab("file");
    }
  }, [open]);

  // Normalize and validate raw parsed data
  const normalizeAndValidate = (rawList: any[]): ParsedPatient[] => {
    return rawList.map((item) => {
      const errors: string[] = [];

      // Determine name fields
      let firstName =
        item.firstName ||
        item.firstname ||
        item.name ||
        item["First Name"] ||
        item["Name"] ||
        "";
      let middleName =
        item.middleName || item.middlename || item["Middle Name"] || "";
      let lastName = item.lastName || item.lastname || item["Last Name"] || "";

      firstName = String(firstName).trim();
      middleName = String(middleName).trim();
      lastName = String(lastName).trim();

      // Split Name if single name field has spaces and lastName is empty
      if (firstName && !lastName) {
        const parts = firstName.split(/\s+/);
        if (parts.length === 2) {
          firstName = parts[0];
          lastName = parts[1];
        } else if (parts.length > 2) {
          firstName = parts[0];
          middleName = parts.slice(1, -1).join(" ");
          lastName = parts[parts.length - 1];
        }
      }

      // Gender normalization
      let gender = item.gender || item.sex || item.Gender || item.Sex || "Male";
      gender = String(gender).trim().toLowerCase();
      if (gender.startsWith("m")) gender = "Male";
      else if (gender.startsWith("f")) gender = "Female";
      else gender = "Other";

      // DOB normalization & Date formatting
      let dob =
        item.dob ||
        item.dateOfBirth ||
        item.dobDate ||
        item.DOB ||
        item["Date of Birth"] ||
        "";
      if (dob) {
        if (typeof dob === "number") {
          // Excel serial date number conversion
          const utcDays = Math.floor(dob - 25569);
          const utcValue = utcDays * 86400;
          const dateInfo = new Date(utcValue * 1000);
          dob = dateInfo.toISOString().split("T")[0];
        } else {
          dob = String(dob).trim();
          const ddmmyyyy = dob.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (ddmmyyyy) {
            dob = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
          } else {
            const iso = dob.split("T")[0];
            if (iso.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dob = iso;
            }
          }
        }
      }

      // Blood Group normalization
      let bloodGroup =
        item.bloodGroup || item.bloodgroup || item["Blood Group"] || "";
      if (bloodGroup) {
        bloodGroup = String(bloodGroup).toUpperCase().trim();
        if (bloodGroup.includes("VE")) {
          bloodGroup = bloodGroup
            .replace("VE", "")
            .replace("POSI", "+")
            .replace("NEGA", "-");
        }
      }

      // Validation
      if (!firstName) {
        errors.push("Patient Name or First Name is required.");
      }

      const patientReq: PatientRequest = {
        firstName,
        middleName: middleName || undefined,
        lastName: lastName || undefined,
        gender,
        dob: dob || undefined,
        phone: item.phone || item.mobile || item.Phone || item.Mobile || "",
        bloodGroup: bloodGroup || undefined,
        address: item.address || item.Address || undefined,
        placePin: item.placePin || item.place || item.Place || undefined,
      };

      return {
        data: patientReq,
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  // Parse plain text blocks/CSV/JSON
  const parseText = (text: string) => {
    setIsAnalyzing(true);
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        setParsedPatients([]);
        return;
      }

      // 1. Try JSON parsing
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          const validated = normalizeAndValidate(list);
          setParsedPatients(validated);
          toast.success(
            `Successfully parsed ${validated.length} patients from JSON.`,
          );
          return;
        } catch (e) {
          // Fallback to text parsing if JSON fails
        }
      }

      // 2. CSV / Tabular lines parsing
      const lines = trimmed.split("\n");
      const list: any[] = [];

      for (const line of lines) {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) continue;

        // If line is header, skip it
        if (
          lineTrimmed.toLowerCase().includes("first name") ||
          lineTrimmed.toLowerCase().includes("patient name")
        ) {
          continue;
        }

        // Split by delimiter
        const parts = lineTrimmed.split(/[\t,;|]/);
        if (parts.length >= 3) {
          list.push({
            name: parts[0]?.trim(),
            gender: parts[1]?.trim(),
            dob: parts[2]?.trim(),
            phone: parts[3]?.trim() || "",
            bloodGroup: parts[4]?.trim() || "",
          });
        } else if (lineTrimmed.includes(":")) {
          // Key-Value parsing
          const pairs = lineTrimmed.split(/[;,|]/);
          const p: any = {};
          for (const pair of pairs) {
            const kv = pair.split(":");
            if (kv.length >= 2) {
              const k = kv[0].trim().toLowerCase();
              const v = kv.slice(1).join(":").trim();
              if (k.includes("first") && k.includes("name")) p.firstName = v;
              else if (k.includes("last") && k.includes("name")) p.lastName = v;
              else if (k.includes("name")) p.name = v;
              else if (k.includes("gender") || k.includes("sex")) p.gender = v;
              else if (k.includes("dob") || k.includes("birth")) p.dob = v;
              else if (k.includes("phone") || k.includes("mobile")) p.phone = v;
              else if (k.includes("blood")) p.bloodGroup = v;
            }
          }
          if (p.firstName || p.name) {
            list.push(p);
          }
        }
      }

      const validated = normalizeAndValidate(list);
      setParsedPatients(validated);
      if (validated.length > 0) {
        toast.success(`Parsed ${validated.length} patients from raw text.`);
      } else {
        toast.error(
          "Could not extract any valid patient records from the pasted text.",
        );
      }
    } catch (err) {
      console.error("Text parse error:", err);
      toast.error("Failed to parse text input.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Read uploaded file
  const handleFileProcess = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        const text = await file.text();
        setInputText(text);
        parseText(text);
      } else if (ext === "csv" || ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const validated = normalizeAndValidate(rows);
        setParsedPatients(validated);
        toast.success(
          `Successfully parsed ${validated.length} patients from sheet.`,
        );
      } else if (ext === "pdf") {
        const pdfjs = await loadPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          extractedText += pageText + "\n";
        }

        // Process PDF text with our heuristics parser
        setInputText(extractedText);
        parseText(extractedText);
      } else {
        toast.error(
          "Unsupported file format. Please upload JSON, CSV, Excel, or PDF.",
        );
      }
    } catch (err: any) {
      console.error("File parsing error:", err);
      toast.error(`Failed to parse file: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Download template helpers
  const downloadCSVTemplate = () => {
    const csvContent =
      "First Name,Last Name,Gender,DOB,Phone,Blood Group,Place,Address\nJohn,Doe,Male,1990-05-15,9876543210,O+,New York,123 Main Street\nJane,Smith,Female,1995-10-22,9876543211,A-,Boston,456 Elm Street";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "patient_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcelTemplate = () => {
    const data = [
      {
        "First Name": "John",
        "Last Name": "Doe",
        Gender: "Male",
        DOB: "1990-05-15",
        Phone: "9876543210",
        "Blood Group": "O+",
        Place: "New York",
        Address: "123 Main Street",
      },
      {
        "First Name": "Jane",
        "Last Name": "Smith",
        Gender: "Female",
        DOB: "1995-10-22",
        Phone: "9876543211",
        "Blood Group": "A-",
        Place: "Boston",
        Address: "456 Elm Street",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, "patient_import_template.xlsx");
  };

  const handleImportSubmit = async () => {
    const validPatients = parsedPatients
      .filter((p) => p.isValid)
      .map((p) => p.data);

    if (validPatients.length === 0) {
      toast.error("No valid patient records to import.");
      return;
    }

    setIsImporting(true);
    try {
      await receptionApi.registerPatientsBulk(validPatients, hospitalCode);
      toast.success(`Successfully imported ${validPatients.length} patients!`);
      onImported();
      onClose();
    } catch (err: any) {
      console.error("Bulk import error:", err);
      toast.error(
        err.message || "Failed to import patients. Please try again.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Calculations for stats
  const totalCount = parsedPatients.length;
  const validCount = parsedPatients.filter((p) => p.isValid).length;
  const invalidCount = totalCount - validCount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-400">
            <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
            <DialogTitle className="text-lg font-bold">
              Bulk Patient Import
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload a spreadsheet (Excel/CSV), document (PDF, JSON), or paste raw
            text to parse and import patients in bulk.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-border pb-2.5">
          <Button
            variant={activeTab === "file" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("file")}
            className={`text-xs h-8 rounded-lg ${
              activeTab === "file" ? "bg-teal-600 hover:bg-teal-700" : ""
            }`}
          >
            File Upload
          </Button>
          <Button
            variant={activeTab === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("text")}
            className={`text-xs h-8 rounded-lg ${
              activeTab === "text" ? "bg-teal-600 hover:bg-teal-700" : ""
            }`}
          >
            Raw JSON / Text Copy-Paste
          </Button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
          {activeTab === "file" ? (
            <div className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-teal-500 bg-teal-500/5"
                    : "border-border hover:border-teal-500/30 hover:bg-muted/15"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv,.xlsx,.xls,.pdf"
                  className="hidden"
                />
                <div className="p-3 rounded-full bg-teal-500/10 text-teal-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Drag & drop file here or click to browse
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Accepts Excel (.xlsx, .xls), CSV, JSON, and PDF documents
                  </p>
                </div>
              </div>

              {/* Template Downloaders */}
              <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium text-foreground/80">
                    Need templates to get started?
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                    className="text-[10px] h-7 gap-1 px-3.5 rounded-lg border-teal-500/20 text-teal-600 hover:bg-teal-50"
                  >
                    <Download className="w-3 h-3" />
                    CSV Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadExcelTemplate}
                    className="text-[10px] h-7 gap-1 px-3.5 rounded-lg border-teal-500/20 text-teal-600 hover:bg-teal-50"
                  >
                    <Download className="w-3 h-3" />
                    Excel Template
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                Paste raw patient data (JSON list or delimiter-separated rows)
              </Label>
              <Textarea
                placeholder='[\n  {\n    "firstName": "John",\n    "lastName": "Doe",\n    "gender": "Male",\n    "dob": "1990-05-15",\n    "phone": "9876543210"\n  }\n]'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="font-mono text-[11px] min-h-[160px] max-h-[220px]"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => parseText(inputText)}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-xs h-8 rounded-lg gap-1"
                >
                  {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Analyze & Preview
                </Button>
              </div>
            </div>
          )}

          {/* Analyzed Stats Summary */}
          {totalCount > 0 && (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/20 text-center animate-fadeIn">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Total Scanned
                </p>
                <p className="text-lg font-bold text-foreground">
                  {totalCount}
                </p>
              </div>
              <div className="space-y-0.5 border-x border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Valid Records
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {validCount}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Invalid Rows
                </p>
                <p className="text-lg font-bold text-rose-600">
                  {invalidCount}
                </p>
              </div>
            </div>
          )}

          {/* Analyzed Patients Preview Table */}
          {parsedPatients.length > 0 && (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Import Preview List
              </h3>
              <div className="border border-border rounded-xl overflow-hidden max-h-[200px] overflow-y-auto bg-card">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-muted text-muted-foreground font-semibold sticky top-0">
                    <tr className="border-b border-border/80">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">DOB</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPatients.map((p, idx) => {
                      const name = p.data.firstName
                        ? `${p.data.firstName} ${p.data.middleName || ""} ${p.data.lastName || ""}`
                            .replace(/\s+/g, " ")
                            .trim()
                        : "Unknown (Missing name)";
                      return (
                        <tr
                          key={idx}
                          className="border-b border-border/40 hover:bg-muted/15 last:border-0"
                        >
                          <td className="px-3 py-2 font-medium text-foreground">
                            {name}
                          </td>
                          <td className="px-3 py-2">{p.data.gender}</td>
                          <td className="px-3 py-2">{p.data.dob || "—"}</td>
                          <td className="px-3 py-2">{p.data.phone || "—"}</td>
                          <td className="px-3 py-2">
                            {p.isValid ? (
                              <Badge
                                variant="outline"
                                className="gap-1 border-emerald-500/25 text-emerald-600 bg-emerald-500/5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="gap-1 border-rose-500/25 text-rose-600 bg-rose-500/5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                              >
                                <XCircle className="w-2.5 h-2.5" />
                                Invalid
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {invalidCount > 0 && (
                <p className="text-[10px] text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Warning: {invalidCount} invalid rows will be skipped during
                  import.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            disabled={isImporting || validCount === 0}
            onClick={handleImportSubmit}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 px-5 rounded-lg flex items-center gap-2 shadow-md"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Import {validCount} Patients</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
