'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, DollarSign, User, BookOpen, ArrowLeft, Loader2, Calendar, Globe, Award, GraduationCap } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
// course interface for api response
interface Course {
  _id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  price: number;
  rating: number;
  studentsEnrolled: number;
  level: string;
  tags: string[];
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getCourseById(courseId);
        
        if (response.success) {
          setCourse(response.data.course);
        } else {
          toast({
            variant: 'destructive',
            title: 'Course Not Found',
            description: response.message || 'The requested course could not be found.',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load course details.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course details...</p>
    </div>
  </div>
);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested course could not be found.</p>
          <Button asChild>
            <Link href="/courses/search">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/courses/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card>
              <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-2">
                            <Badge variant="secondary">{course.category}</Badge>
                            <Badge variant={course.level === 'Advanced' ? 'destructive' : course.level === 'Intermediate' ? 'default' : 'secondary'}>
                              {course.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{course.rating}/5</span>
                          </div>
                        </div>
                        
                        <CardTitle className="font-headline text-3xl mb-2">{course.title}</CardTitle>
                        <CardDescription className="text-lg">
                          {course.instructor} • {course.course_id}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>

            {/* Course Details */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Category</p>
                      <p className="text-muted-foreground">{course.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">{course.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-muted-foreground">${course.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-muted-foreground">{course.language}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-accent" />
                <div>
                      <p className="font-medium">Instructor</p>
                      <p className="text-muted-foreground">{course.instructor}</p>
                    </div>
                </div>

                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Rating</p>
                      <p className="text-muted-foreground">{course.rating}/5</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Tags */}
            {course.tags && course.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Students Enrolled</p>
                      <p className="text-muted-foreground">{course.studentsEnrolled}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Course Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    ${course.price}
                  </div>
                  <p className="text-muted-foreground">Course Fee</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{course?.duration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-medium">{course?.level || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language:</span>
                    <span className="font-medium">{course?.language || 'N/A'}</span>
                  </div>
                </div>
                
                <Button className="w-full" size="lg">
                  Enroll Now
                  </Button>
              </CardContent>
            </Card>

            {/* Course Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{course?.instructor || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course ID:</span>
                  <span className="font-medium">{course?.course_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={course?.isActive ? "default" : "secondary"}>
                    {course?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Course Summary */}
                <Card>
                    <CardHeader>
                <CardTitle>Course Summary</CardTitle>
                    </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{course?.category || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium">{course?.level || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{course?.duration || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{course?.rating || 'N/A'}/5</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{course?.studentsEnrolled || 'N/A'}</span>
                </div>
                    </CardContent>
                </Card>
          </div>
        </div>
      </div>
    </div>
  );
}