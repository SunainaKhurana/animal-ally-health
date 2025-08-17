
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  reportId?: string;
  preview?: string;
}

interface MultipleFileUploadProps {
  onFilesProcessed: (files: UploadFile[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
}

const MultipleFileUpload = ({ onFilesProcessed, isProcessing, maxFiles = 5 }: MultipleFileUploadProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const handleFileSelection = useCallback((accept: string, capture?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    if (capture) {
      input.setAttribute('capture', capture);
    }
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      addFiles(files);
    };
    input.click();
  }, []);

  const addFiles = (files: File[]) => {
    const remainingSlots = maxFiles - uploadFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const newUploadFiles: UploadFile[] = filesToAdd.map(file => {
      const preview = URL.createObjectURL(file);
      return {
        id: Date.now() + Math.random().toString(),
        file,
        status: 'pending',
        progress: 0,
        preview
      };
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(file => file.id !== id);
    });
  };

  const updateFileStatus = (id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const handleProcessFiles = () => {
    onFilesProcessed(uploadFiles);
  };

  const clearCompleted = () => {
    setUploadFiles(prev => {
      const toRemove = prev.filter(file => file.status === 'completed');
      toRemove.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      return prev.filter(file => file.status !== 'completed');
    });
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
  const processingFiles = uploadFiles.filter(f => f.status === 'processing');
  const completedFiles = uploadFiles.filter(f => f.status === 'completed');
  const errorFiles = uploadFiles.filter(f => f.status === 'error');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Health Report
        </CardTitle>
        <CardDescription>
          Upload multiple images or PDF files of your health report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area - Updated styling to match screenshots */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => handleFileSelection('image/*,application/pdf')}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">Click to upload images or PDF files</p>
          <p className="text-sm text-gray-500">You can select multiple files</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => handleFileSelection('image/*', 'environment')}
            disabled={uploadFiles.length >= maxFiles}
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Take Photos</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => handleFileSelection('.pdf')}
            disabled={uploadFiles.length >= maxFiles}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Upload PDFs</span>
          </Button>
        </div>

        {/* File Thumbnails Grid */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Attachments ({uploadFiles.length}/{maxFiles})
              </h4>
              {completedFiles.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCompleted}
                  className="text-xs"
                >
                  Clear Completed
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                    {uploadFile.file.type.startsWith('image/') ? (
                      <img 
                        src={uploadFile.preview} 
                        alt={uploadFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-red-500" />
                      </div>
                    )}
                    
                    {/* Status Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {getStatusIcon(uploadFile.status)}
                    </div>
                  </div>

                  {/* File Name */}
                  <p className="text-xs text-center mt-1 truncate">
                    {uploadFile.file.name}
                  </p>

                  {/* Remove Button */}
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {/* Progress Bar */}
                  {uploadFile.status === 'processing' && (
                    <Progress value={uploadFile.progress} className="mt-1 h-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        {pendingFiles.length > 0 && (
          <div className="pt-2">
            <Button 
              onClick={handleProcessFiles}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload Report
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status Summary */}
        {(processingFiles.length > 0 || completedFiles.length > 0 || errorFiles.length > 0) && (
          <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t">
            {processingFiles.length > 0 && (
              <span>🔄 {processingFiles.length} processing</span>
            )}
            {completedFiles.length > 0 && (
              <span>✅ {completedFiles.length} completed</span>
            )}
            {errorFiles.length > 0 && (
              <span>❌ {errorFiles.length} failed</span>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">AI analysis will be generated after upload</p>
          <div className="space-y-1">
            <p>• Supported formats: JPG, PNG, PDF</p>
            <p>• Maximum {maxFiles} files per report</p>
            <p>• Maximum file size: 10MB each</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultipleFileUpload;
