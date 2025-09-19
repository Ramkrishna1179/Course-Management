'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CourseUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'text/csv') {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select a .csv file.',
          duration: 5000,
        });
        setSelectedFile(null);
        event.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select a CSV file to upload.',
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await apiService.uploadCSV(selectedFile);
      
      if (response.success) {
        setUploadResult(response.data);
        const data = response.data;
        const successMessage = `Successfully processed ${data.total || 0} courses: ${data.created || 0} created, ${data.updated || 0} updated`;
        
        toast({
          title: 'Upload Successful!',
          description: successMessage,
          duration: 6000,
        });
        
        // Reset form
        setSelectedFile(null);
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        // Handle validation errors with detailed messages
        if (response.errors && response.errors.length > 0) {
          toast({
            variant: 'destructive',
            title: 'CSV Validation Failed',
            description: (
              <div className="space-y-2">
                <p className="font-medium">Please fix the following errors:</p>
                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {response.errors.map((error: any, index: number) => (
                    <div key={index} className="bg-red-50 p-2 rounded border-l-2 border-red-400">
                      <strong>Row {error.row} ({error.course_id}):</strong>
                      <ul className="ml-4 mt-1">
                        {error.errors.map((err: string, errIndex: number) => (
                          <li key={errIndex} className="text-red-700">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {response.validRows && response.validRows.length > 0 && (
                  <p className="text-sm text-green-600">
                    ✓ {response.validRows.length} valid rows were processed successfully
                  </p>
                )}
              </div>
            ),
            duration: 10000,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: response.message || 'Failed to upload CSV file.',
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: error.message || 'Failed to upload CSV file.',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "course_id", "title", "description", "category", "instructor", 
      "duration", "price", "rating", "level", "thumbnail", "tags", "language"
    ];
    
    // Sample data row
    const sampleRow = [
      "CS101", "Introduction to Programming", "Learn basic programming concepts", 
      "Programming", "John Doe", "40 hours", "99", "4.5", "Beginner", 
      "https://example.com/image.jpg", "programming,basics", "English"
    ];
    
    const csvContent = [
      headers.map(header => `"${header}"`).join(','),
      sampleRow.map(field => `"${field}"`).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "course_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-4">
          <h2 className="font-headline text-4xl font-bold mb-2 text-primary">Course Upload</h2>
          <p className="text-muted-foreground mb-8">Upload course data from CSV files to the database.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-accent" />
                  Upload CSV File
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with course information to add multiple courses at once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="file:text-primary file:font-semibold"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || isUploading} 
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Upload Instructions
                </CardTitle>
                <CardDescription>
                  Follow these guidelines for successful CSV uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">File Format</p>
                      <p className="text-sm text-muted-foreground">
                        Use CSV format with UTF-8 encoding
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Required Columns</p>
                      <p className="text-sm text-muted-foreground">
                        course_id, title, description, category, instructor, duration, price, rating, level
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">File Size</p>
                      <p className="text-sm text-muted-foreground">
                        Maximum 10MB per file
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Data Validation</p>
                      <p className="text-sm text-muted-foreground">
                        Invalid rows will be skipped with error messages
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Sample CSV Format:</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    course_id,title,description,category,instructor,duration,price,rating,level<br/>
                    CS101,Introduction to Programming,Learn basic programming concepts,Programming,John Doe,40 hours,99,4.5,Beginner
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Results */}
          {uploadResult && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.coursesCreated || 0}
                    </div>
                    <div className="text-sm text-green-700">Courses Created</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.coursesUpdated || 0}
                    </div>
                    <div className="text-sm text-blue-700">Courses Updated</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResult.errors?.length || 0}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                    <div className="bg-red-50 p-3 rounded text-sm">
                      {uploadResult.errors.map((error: any, index: number) => (
                        <div key={index} className="text-red-700">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
