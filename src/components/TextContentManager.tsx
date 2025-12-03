import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type TextContent } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function TextContentManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ key: '', content: '' });

  const { data: texts, isLoading } = useQuery({
    queryKey: ['textContents'],
    queryFn: () => apiService.getTextContents(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<TextContent, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiService.createTextContent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textContents'] });
      setIsCreating(false);
      setFormData({ key: '', content: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TextContent> }) =>
      apiService.updateTextContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textContents'] });
      setEditingId(null);
      setFormData({ key: '', content: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTextContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['textContents'] });
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
    setIsCreating(true);
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
        <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ key: '', content: '' }); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Text Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Key</label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(texts) && texts.map((text) => (
          <Card key={text.id}>
            <CardHeader>
              <CardTitle className="text-lg">{text.key}</CardTitle>
              <CardDescription className="line-clamp-2">{text.content}</CardDescription>
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
                    if (confirm('Are you sure you want to delete this?')) {
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

