import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type PageConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function PageConfigManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PageConfig>>({
    pageKey: '',
    title: '',
    description: '',
    config: {},
  });
  const [configJson, setConfigJson] = useState('{}');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['pageConfigs'],
    queryFn: () => apiService.getPageConfigs(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiService.createPageConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageConfigs'] });
      setIsCreating(false);
      setFormData({ pageKey: '', title: '', description: '', config: {} });
      setConfigJson('{}');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PageConfig> }) =>
      apiService.updatePageConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageConfigs'] });
      setEditingId(null);
      setIsCreating(false);
      setFormData({ pageKey: '', title: '', description: '', config: {} });
      setConfigJson('{}');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deletePageConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageConfigs'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = JSON.parse(configJson);
      const data = { ...formData, config };
      if (editingId) {
        updateMutation.mutate({ id: editingId, data });
      } else {
        createMutation.mutate(data as Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>);
      }
    } catch (error) {
      alert('Invalid JSON in config field');
    }
  };

  const handleEdit = (config: PageConfig) => {
    setEditingId(config.id!);
    setFormData({
      pageKey: config.pageKey,
      title: config.title,
      description: config.description || '',
      config: config.config,
    });
    setConfigJson(JSON.stringify(config.config, null, 2));
    setIsCreating(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Page Config</h2>
          <p className="text-muted-foreground">Manage page configurations</p>
        </div>
        <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ pageKey: '', title: '', description: '', config: {} }); setConfigJson('{}'); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Config
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Page Config</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Page Key</label>
                <Input
                  value={formData.pageKey}
                  onChange={(e) => setFormData({ ...formData, pageKey: e.target.value })}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Config (JSON)</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
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
        {Array.isArray(configs) && configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{config.pageKey}</CardDescription>
              {config.description && (
                <p className="mt-2 text-sm text-muted-foreground">{config.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-md bg-muted p-2">
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(config.config, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(config)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this?')) {
                      deleteMutation.mutate(config.id!);
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

