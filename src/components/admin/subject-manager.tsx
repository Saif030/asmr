"use client";

import * as React from "react";
import { toast } from "sonner";
import { Book, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Subject = {
  $id: string;
  name: string;
  slug: string;
  createdBy: string | null;
  createdAt: string;
};

export function SubjectManager() {
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<Subject | null>(null);
  const [name, setName] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const response = await fetch("/api/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      }
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        toast.success("Subject created");
        setName("");
        setDialogOpen(false);
        void load();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create subject");
      }
    } catch {
      toast.error("Failed to create subject");
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject || !name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    try {
      const response = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSubject.$id, name }),
      });

      if (response.ok) {
        toast.success("Subject updated");
        setName("");
        setEditingSubject(null);
        setDialogOpen(false);
        void load();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update subject");
      }
    } catch {
      toast.error("Failed to update subject");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Subject deleted");
        void load();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete subject");
      }
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  const openCreateDialog = () => {
    setEditingSubject(null);
    setName("");
    setDialogOpen(true);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSubject) {
      void handleUpdate();
    } else {
      void handleCreate();
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Subjects ({subjects.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Update the subject name below." : "Enter a name for the new subject."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="subject-name" className="text-sm font-medium text-foreground">
                  Subject Name
                </label>
                <Input
                  id="subject-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mathematics"
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit}>{editingSubject ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-8 text-sm text-foreground-subtle">
          No subjects yet. Add your first subject above.
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.$id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <Book className="h-4 w-4 text-foreground-subtle" />
                <span className="text-sm font-medium text-foreground">{subject.name}</span>
                <span className="text-xs text-foreground-subtle">/{subject.slug}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditDialog(subject)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-danger"
                  onClick={() => handleDelete(subject.$id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
