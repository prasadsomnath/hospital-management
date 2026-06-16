import { PhoneInput } from "@/components/ui/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import {
  Edit,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Users2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Contacts() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactSrl, setSelectedContactSrl] = useState<number | null>(
    null,
  );
  const [editingContactSrl, setEditingContactSrl] = useState<number | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Search parameters
  const [contactSearch, setContactSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Form Fields States
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [marriageDate, setMarriageDate] = useState("");
  const [spouse, setSpouse] = useState("");
  const [address, setAddress] = useState("");

  // Fetch CRM contacts from live backend
  const fetchContactsData = async () => {
    if (!user?.hospitalCode) return;
    try {
      const data = await apiFetch<any[]>("/admin/contacts");
      if (data && Array.isArray(data)) {
        const mapped = data.map((c, idx) => ({
          srl: idx + 1,
          id: c.id,
          name: c.name || "N/A",
          dob: c.dob || "N/A",
          phone: c.phone || "N/A",
          email: c.email || "N/A",
          address: c.address || "N/A",
          marriageDate: c.marriageDate || "N/A",
          spouse: c.spouseName || "N/A",
        }));
        setContacts(mapped);
        localStorage.setItem(
          `medicore-contacts-${user?.hospitalCode || "default"}`,
          JSON.stringify(mapped),
        );
      }
    } catch (err) {
      console.warn("Utilizing offline mock caches for Contacts CRM:", err);
      const saved = localStorage.getItem(
        `medicore-contacts-${user?.hospitalCode || "default"}`,
      );
      if (saved) {
        setContacts(JSON.parse(saved));
      } else {
        setContacts([]);
      }
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, [user?.hospitalCode]);

  const handleRefresh = async () => {
    await fetchContactsData();
    toast.success("Contact records refreshed");
  };

  // Open Dialog for Adding
  function handleOpenAdd() {
    setEditingContactSrl(null);
    setFullName("");
    setDob("");
    setPhone("");
    setEmail("");
    setMarriageDate("");
    setSpouse("");
    setAddress("");
    setOpen(true);
  }

  // Open Dialog for Editing
  function handleOpenEdit() {
    if (selectedContactSrl === null) {
      toast.warning(
        "Please select a contact record to edit first by clicking its row.",
      );
      return;
    }
    const item = contacts.find((c) => c.srl === selectedContactSrl);
    if (!item) return;

    setEditingContactSrl(selectedContactSrl);
    setFullName(item.name);
    setDob(item.dob);
    setPhone(item.phone);
    setEmail(item.email);
    setMarriageDate(item.marriageDate);
    setSpouse(item.spouse);
    setAddress(item.address);
    setOpen(true);
  }

  // Save or Update contact
  async function handleSaveContact() {
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Full Name and Phone Number are required fields");
      return;
    }

    const reqBody = {
      name: fullName,
      dob,
      phone,
      email,
      marriageDate,
      spouseName: spouse,
      address,
    };

    try {
      if (editingContactSrl !== null) {
        // Edit Mode
        const itemToUpdate = contacts.find((c) => c.srl === editingContactSrl);
        const contactId = itemToUpdate?.id;
        const isNumericId = contactId && /^\d+$/.test(String(contactId));

        if (itemToUpdate && contactId) {
          try {
            if (isNumericId) {
              await apiFetch(`/admin/contacts/${contactId}`, {
                method: "PUT",
                body: JSON.stringify(reqBody),
              });
            }
          } catch (apiErr) {
            console.warn("API Offline. Updating locally.", apiErr);
          }
        }
        const updated = contacts.map((c) =>
          c.srl === editingContactSrl
            ? {
                ...c,
                name: fullName,
                dob,
                phone,
                email,
                marriageDate,
                spouse,
                address,
              }
            : c,
        );
        setContacts(updated);
        localStorage.setItem(
          `medicore-contacts-${user?.hospitalCode || "default"}`,
          JSON.stringify(updated),
        );
        toast.success("Contact profile updated successfully");
      } else {
        // Create Mode
        let savedContact: any = null;
        try {
          savedContact = await apiFetch<any>("/admin/contacts", {
            method: "POST",
            body: JSON.stringify(reqBody),
          });
        } catch (apiErr) {
          console.warn("API Offline. Appending locally.", apiErr);
        }

        const nextSrl =
          contacts.length > 0 ? Math.max(...contacts.map((c) => c.srl)) + 1 : 1;
        const newContact = {
          srl: nextSrl,
          id: savedContact?.id || `CONTACT-LOCAL-${Date.now()}`,
          name: fullName,
          dob: dob || "N/A",
          phone,
          email: email || "N/A",
          address: address || "N/A",
          marriageDate: marriageDate || "N/A",
          spouse: spouse || "N/A",
        };
        const updated = [...contacts, newContact];
        setContacts(updated);
        localStorage.setItem(
          `medicore-contacts-${user?.hospitalCode || "default"}`,
          JSON.stringify(updated),
        );
        toast.success("New CRM contact created");
      }
      setOpen(false);
      setSelectedContactSrl(null);
      fetchContactsData();
    } catch (err) {
      toast.error("Failed to commit contact record");
    }
  }

  // Delete selected contact
  function handleDeleteContact() {
    if (selectedContactSrl === null) {
      toast.warning("Please select a contact record to delete first.");
      return;
    }
    setDeleteConfirmOpen(true);
  }

  async function confirmDeleteContact() {
    setDeleteConfirmOpen(false);
    if (selectedContactSrl === null) return;
    const item = contacts.find((c) => c.srl === selectedContactSrl);
    if (item) {
      const contactId = item.id;
      const isNumericId = contactId && /^\d+$/.test(String(contactId));

      if (contactId) {
        try {
          if (isNumericId) {
            await apiFetch(`/admin/contacts/${contactId}`, {
              method: "DELETE",
            });
          }
        } catch (apiErr) {
          console.warn("API Offline. Deleting locally.", apiErr);
        }
      }
      const updated = contacts.filter((c) => c.srl !== selectedContactSrl);
      setContacts(updated);
      localStorage.setItem(
        `medicore-contacts-${user?.hospitalCode || "default"}`,
        JSON.stringify(updated),
      );
      setSelectedContactSrl(null);
      toast.success("Contact removed successfully");
      fetchContactsData();
    }
  }

  // Filter contacts list based on search parameters
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  return (
    <div
      className="space-y-4 h-[calc(100vh-8rem)] flex flex-col"
      data-ocid="contacts.page"
    >
      <div className="flex-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Contacts & CRM
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Manage personal and professional contacts (12 fields)
              </p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-xs px-3 py-1 font-semibold tracking-wider">
            CRM Dashboard
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 glass-elevated rounded-xl border border-border shadow-glass-sm mt-2">
        <div className="p-2 border-b border-border bg-muted/20 flex flex-wrap gap-3 shadow-glass-sm border border-border items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1.5 font-bold shadow-sm transition-colors"
              onClick={handleOpenAdd}
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 font-semibold text-foreground border-border hover:bg-muted"
              onClick={handleOpenEdit}
            >
              <Edit className="w-3.5 h-3.5 text-orange-400" /> Edit Selected
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 font-semibold text-destructive border-border hover:bg-destructive/10"
              onClick={handleDeleteContact}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>

            {/* Quick find input in toolbar */}
            <div className="relative group w-60 ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
              <Input
                placeholder="Find active contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="h-8 pl-9 pr-4 text-xs bg-background border-border w-full rounded-md focus-visible:ring-1 focus-visible:ring-orange-500/30"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync CRM
            </Button>
          </div>
        </div>

        {/* Active Dialog for Adding/Editing Contacts */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-6xl w-[92vw] border border-slate-300 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 rounded-2xl animate-fade-in">
            <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <DialogTitle className="text-2xl font-extrabold font-display text-orange-600 dark:text-orange-500 tracking-tight flex items-center gap-2">
                <Users2 className="w-6 h-6 text-orange-600" />
                {editingContactSrl !== null
                  ? "Edit CRM Contact Profile"
                  : "Add CRM Contact Record"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 pt-6">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Full Name
                </Label>
                <Input
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Sarah Johnson"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Phone No.
                </Label>
                <PhoneInput
                  className="h-11 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter 10-digit number"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Email Address
                </Label>
                <Input
                  type="email"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.j@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Marriage Date
                </Label>
                <Input
                  type="date"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={marriageDate}
                  onChange={(e) => setMarriageDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Spouse Name
                </Label>
                <Input
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={spouse}
                  onChange={(e) => setSpouse(e.target.value)}
                  placeholder="Mark Johnson"
                />
              </div>

              <div className="space-y-1.5 md:col-span-4">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5 block">
                  Full Address
                </Label>
                <Textarea
                  rows={2}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm transition-colors text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical residence address..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
              <Button
                variant="outline"
                className="h-10 px-5 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-lg"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20 rounded-lg"
                onClick={handleSaveContact}
              >
                {editingContactSrl !== null ? "Update Contact" : "Save Contact"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* LIST TABLE */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Srl
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Name
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  DOB
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Phone
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Email
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Marriage Date
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Spouse Name
                </th>
                <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-transparent">
              {filteredContacts.length > 0 ? (
                filteredContacts.slice(page * pageSize, (page + 1) * pageSize).map((row) => {
                  const isSelected = selectedContactSrl === row.srl;
                  return (
                    <tr
                      key={row.srl}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-orange-500/5 dark:bg-orange-500/10 hover:bg-orange-500/10 dark:hover:bg-orange-500/20"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedContactSrl(isSelected ? null : row.srl)
                      }
                    >
                      <td
                        className={`px-4 py-3 text-muted-foreground font-mono transition-all ${
                          isSelected
                            ? "border-l-4 border-orange-500 pl-3 font-bold text-orange-600"
                            : ""
                        }`}
                      >
                        {row.srl}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.dob}
                      </td>
                      <td className="px-4 py-3 font-mono text-orange-600 font-bold">
                        {row.phone}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.marriageDate}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {row.spouse}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[240px] truncate">
                        {row.address}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-slate-400 dark:text-slate-500 font-medium"
                  >
                    No active CRM contacts found.
                  </td>
                </tr>
              )}
              </tbody>

            </table>

            <div className="px-5 py-3 border-t border-border mt-auto">

              <PaginationControl

                currentPage={page}

                totalPages={Math.ceil(filteredContacts.length / pageSize) || 1}

                totalElements={filteredContacts.length}

                pageSize={pageSize}

                onPageChange={setPage}

                onPageSizeChange={setPageSize}

              />

            </div>

            </div>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-background border border-border text-foreground rounded-3xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Remove Contact</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2">
            Are you sure you want to delete this contact record? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteContact}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
