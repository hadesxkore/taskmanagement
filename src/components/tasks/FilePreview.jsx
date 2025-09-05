import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

const FilePreview = ({ file, taskId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/attachments/${file.filename}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching file:', error);
        toast.error('Error loading file');
      }
    };

    fetchFile();
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, taskId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {file.originalName}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewUrl;
                link.download = file.originalName;
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 relative bg-muted">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Loading file...</span>
              </div>
            </div>
          ) : (
            <iframe
              src={previewUrl + '#toolbar=0'}
              className="w-full h-[calc(90vh-4rem)]"
              title="File Preview"
              style={{
                border: 'none',
                background: 'white'
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;