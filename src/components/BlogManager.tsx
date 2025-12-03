import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, type BlogPost } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function BlogManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPublished, setShowPublished] = useState<boolean | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    published: false,
    tags: [],
  });

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogPosts', showPublished],
    queryFn: () => apiService.getBlogPosts(showPublished),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiService.createBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      setIsCreating(false);
      setFormData({ title: '', slug: '', content: '', excerpt: '', published: false, tags: [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) =>
      apiService.updateBlogPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      setEditingId(null);
      setIsCreating(false);
      setFormData({ title: '', slug: '', content: '', excerpt: '', published: false, tags: [] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData as Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingId(blog.id!);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: blog.excerpt || '',
      published: blog.published || false,
      tags: blog.tags || [],
    });
    setIsCreating(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog Posts</h2>
          <p className="text-muted-foreground">Manage blog posts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showPublished === undefined ? 'default' : 'outline'}
            onClick={() => setShowPublished(undefined)}
          >
            All
          </Button>
          <Button
            variant={showPublished === true ? 'default' : 'outline'}
            onClick={() => setShowPublished(true)}
          >
            Published
          </Button>
          <Button
            variant={showPublished === false ? 'default' : 'outline'}
            onClick={() => setShowPublished(false)}
          >
            Drafts
          </Button>
          <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ title: '', slug: '', content: '', excerpt: '', published: false, tags: [] }); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Blog Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <Input
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Published
                </label>
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
        {Array.isArray(blogs) && blogs.map((blog) => (
          <Card key={blog.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{blog.title}</CardTitle>
                {blog.published && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                    Published
                  </span>
                )}
              </div>
              <CardDescription>{blog.slug}</CardDescription>
              {blog.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{blog.excerpt}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(blog)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this?')) {
                      deleteMutation.mutate(blog.id!);
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

