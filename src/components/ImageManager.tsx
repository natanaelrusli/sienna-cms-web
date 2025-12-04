import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

export function ImageManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: images, isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: () => apiService.getImages(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiService.uploadImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    uploadMutation.mutate(file);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Images</h2>
          <p className="text-muted-foreground">Manage uploaded images</p>
        </div>
        <div>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button
            asChild
            disabled={uploading}
          >
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </label>
          </Button>
        </div>
      </div>

      {uploadMutation.isError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Upload failed. Please try again.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.isArray(images) && images.map((filename) => (
          <Card key={filename} className="overflow-hidden">
            <div className="aspect-square bg-muted">
              <img
                src={apiService.getImageUrl(filename)}
                alt={filename}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <CardContent className="p-4">
              <p className="truncate text-sm font-medium">{filename}</p>
              <a
                href={apiService.getImageUrl(filename)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-muted-foreground hover:text-foreground"
              >
                View full size
              </a>
            </CardContent>
          </Card>
        ))}
        {(!Array.isArray(images) || images.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No images uploaded yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

