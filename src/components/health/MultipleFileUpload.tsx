
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
    
    const newUploadFiles: UploadFile[] = filesToAdd.map(file => ({
      id: Date.now() + Math.random().toString(),
      file,
      status: 'pending',
      progress: 0
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
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
    setUploadFiles(prev => prev.filter(file => file.status !== 'completed'));
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
          Upload Health Records
        </CardTitle>
        <CardDescription>
          Upload multiple diagnostic test results, lab reports, or veterinary records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('image/*', 'environment')}
            disabled={uploadFiles.length >= maxFiles}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Take Photos</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('image/*')}
            disabled={uploadFiles.length >= maxFiles}
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload Images</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleFileSelection('.pdf')}
            disabled={uploadFiles.length >= maxFiles}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Upload PDFs</span>
          </Button>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Files ({uploadFiles.length}/{maxFiles})
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

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {uploadFile.status === 'processing' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process {pendingFiles.length} Report{pendingFiles.length !== 1 ? 's' : ''}
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
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Supported formats: JPG, PNG, PDF</p>
          <p>• Maximum {maxFiles} files at once</p>
          <p>• Maximum file size: 10MB each</p>
          <p>• AI will analyze each report and provide insights</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultipleFileUpload;
