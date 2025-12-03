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

export function TextContentManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Text Content</h2>
          <p className="text-muted-foreground">Manage text content by key</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Text Content</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the text content below."
                : "Add a new text content entry with a unique key."}
            </DialogDescription>
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
              <textarea
                id="content"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(texts) &&
          texts.map((text) => (
            <Card key={text.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg">{text.key}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {text.content}
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
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this?")) {
                        deleteMutation.mutate(text.id!);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
