'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Building2, CheckCircle, Download, Loader2, BarChart3, Users, BookOpen } from 'lucide-react';
import { apiService } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function UploadCard({ title, description, onUpload, onDownloadTemplate }: { title: string, description: string, onUpload: (file: File) => void, onDownloadTemplate?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'text/csv') {
        setSelectedFile(file);
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
    if (selectedFile) {
      setIsUploading(true);
      try {
        await onUpload(selectedFile);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById(`file-upload-${title}`) as HTMLInputElement;
        if(fileInput) fileInput.value = '';
      } catch (error) {
        // Handle upload error
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              {title === 'Universities' ? <Building2 className="text-accent"/> : <FileText className="text-accent"/>}
              {title} Data
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onDownloadTemplate && (
            <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input 
            id={`file-upload-${title}`} 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            disabled={isUploading}
            className="file:text-primary file:font-semibold"
        />
        {selectedFile && <p className="text-sm text-muted-foreground">Selected file: {selectedFile.name}</p>}
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile and dashboard statistics
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingStats(true);
      try {
        // Load user profile
        const profileResponse = await apiService.getProfile();
        if (profileResponse.success) {
          setUserProfile(profileResponse.data);
        }

        // Load dashboard statistics
        const statsResponse = await apiService.getCourseStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        // Handle loading error
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadData();
  }, []);


  const handleCourseUpload = async (file: File) => {
    try {
      const response = await apiService.uploadCSV(file);
      if (response.success) {
        const data = response.data;
        const successMessage = `Successfully processed ${data.total || 0} courses: ${data.created || 0} created, ${data.updated || 0} updated`;
        
        toast({
          title: <div className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Upload Successful</div>,
          description: successMessage,
          duration: 6000,
        });
        
        // Reload stats
        const statsResponse = await apiService.getCourseStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } else {
        // Handle validation errors with detailed messages
        if (response.errors && response.errors.length > 0) {
          const errorDetails = response.errors.map((error: any) => 
            `Row ${error.row} (${error.course_id}): ${error.errors.join(', ')}`
          ).join('\n');
          
          toast({
            variant: 'destructive',
            title: 'CSV Validation Failed',
            description: (
              <div className="space-y-2">
                <p className="font-medium">Please fix the following errors:</p>
                <div className="text-sm space-y-1">
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
            description: response.message || 'Failed to upload course data.',
            duration: 5000,
          });
        }
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      // Handle network or other errors
      if (error.message && !error.message.includes('Upload failed')) {
        toast({
          variant: 'destructive',
          title: 'Upload Error',
          description: error.message,
          duration: 5000,
        });
      }
      throw error;
    }
  };

  const handleUniversityTemplateDownload = () => {
    const headers = [
      "University Name", "Unique Code", "Image URL", "Location (City, Country)",
      "Full Address", "Established Year", "Type", "Partner University (Yes/No)",
      "Description", "Long Description", "Official Website", "Email", "Contact Number",
      "Application Fee Waived (Yes/No)", "US News & World Report", "QS Ranking",
      "THE (Times Higher Education)", "ARWU (Shanghai Ranking)", "Our Ranking",
      "Fields of Study (comma-separated)", "Program Offerings (IDs) (comma-separated IDs)",
      "Tuition Fees Min", "Tuition Fees Max", "Tuition Fees Currency",
      "Tuition Fees Notes", "Admission Requirements (use \"\" for multiline)",
      "Campus Life (use \"\" for multiline)"
    ];
    const csvHeader = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',');
    const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "university_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleUpdateEnrollments = async () => {
    try {
      const response = await apiService.updateEnrollments();
      if (response.success) {
        toast({
          title: <div className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Student Data Updated</div>,
          description: `Successfully updated ${response.data.updatedCount} courses with student enrollment data`,
          duration: 6000,
        });
        
        // Reload stats
        const statsResponse = await apiService.getCourseStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: response.message || 'Failed to update student data',
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: error.message || 'Failed to update student data',
        duration: 5000,
      });
    }
  };

  const handleCourseTemplateDownload = () => {
    const headers = [
      "course_id", "title", "description", "category", "instructor", 
      "duration", "price", "rating", "level", "studentsEnrolled", "tags", "language"
    ];
    
    // Sample data row
    const sampleRow = [
      "CS101", "Introduction to Programming", "Learn basic programming concepts", 
      "Programming", "John Doe", "40 hours", "99", "4.5", "Beginner", "1250",
      "programming,basics", "English"
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
          <h2 className="font-headline text-4xl font-bold mb-2 text-primary">Admin Dashboard</h2>
          <p className="text-muted-foreground mb-8">Manage course data and view analytics.</p>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalCourses || 0
                  )}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalStudents || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'
                  )}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.categoryBreakdown?.length || 0
                  )}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UploadCard
          title="Courses"
          description="Upload a CSV file with course information to add multiple courses at once."
          onUpload={handleCourseUpload}
          onDownloadTemplate={handleCourseTemplateDownload}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-2xl">
              <BarChart3 className="text-accent"/>
              Quick Actions
            </CardTitle>
            <CardDescription>Manage your course data efficiently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" variant="outline" asChild>
              <Link href="/courses/search">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Courses
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/admin/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Courses
              </Link>
            </Button>
            <Button className="w-full" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button className="w-full" variant="outline" onClick={handleUpdateEnrollments}>
              <Users className="mr-2 h-4 w-4" />
              Update Student Data
            </Button>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
