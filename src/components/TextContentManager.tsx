import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, type TextContent } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import ContentEditor from "@/components/ui/content-editor";
import { Toaster, toast } from "sonner";

export function TextContentManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ key: "", content: "" });

  const { data: texts, isLoading } = useQuery({
    queryKey: ["textContents"],
    queryFn: () => apiService.getTextContents(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<TextContent, "id" | "createdAt" | "updatedAt">) =>
      apiService.createTextContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textContents"] });
      setIsDialogOpen(false);
      setFormData({ key: "", content: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TextContent> }) =>
      apiService.updateTextContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textContents"] });
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ key: "", content: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTextContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textContents"] });
      toast.success("Text content deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete text content");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (text: TextContent) => {
    setEditingId(text.id!);
    setFormData({ key: text.key, content: text.content });
    setIsDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ key: "", content: "" });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ key: "", content: "" });
  };

  const handleOpenDeleteDialog = (id: string) => {
    setIsDeleteDialogOpen(true);
    setDeletingId(id);
  };

  const handleDelete = () => {
    deleteMutation.mutate(deletingId!);
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Text Content</h2>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => setIsDeleteDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Text Content</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              No, Return
            </Button>
            <Button variant="destructive" onClick={() => handleDelete()}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Text Content</DialogTitle>
            <DialogDescription>Edit the text content below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                required
                disabled={!!editingId}
                placeholder="e.g., welcome-message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <ContentEditor
                initialContent={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                isOpen={isDialogOpen}
                placeholder="Enter the text content..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        {Array.isArray(texts) &&
          texts.map((text) => (
            <Card key={text.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">{text.key}</CardTitle>
                <CardDescription className="line-clamp-2">
                  <div dangerouslySetInnerHTML={{ __html: text.content }} />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(text)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteDialog(text.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <Toaster />
    </div>
  );
}
