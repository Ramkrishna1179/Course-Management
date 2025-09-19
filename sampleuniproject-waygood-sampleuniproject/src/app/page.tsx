'use client';

import { useState, useMemo, useEffect } from 'react';
import { courses } from '@/lib/data/courses';
import { universities } from '@/lib/data/universities';
import type { Course, University } from '@/lib/types';
import CourseCard from '@/components/course-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Compass, Search, SlidersHorizontal, Sparkles, Loader2, DollarSign, CalendarDays, Globe, ArrowRight, Building2 } from 'lucide-react';
import { apiService } from '@/lib/api';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [tuitionRange, setTuitionRange] = useState([0, 50000]);
  const [courseLevel, setCourseLevel] = useState('all');
  const [backendCourses, setBackendCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  
  // Course details modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);


  // Course details modal handlers
  const openCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const closeCourseDetails = () => {
    setSelectedCourse(null);
    setShowCourseModal(false);
  };

  const universityOptions = useMemo(() => {
    return universities.map((uni) => ({ value: uni.uniqueCode, label: uni.universityName }));
  }, []);

  const courseLevels = useMemo(() => {
    if (useBackend) {
      // For backend data, use the actual levels from the backend
      return ['all', 'Beginner', 'Intermediate', 'Advanced'];
    } else {
      // For sample data, use the levels from sample courses
      const levels = new Set(courses.map(course => course.courseLevel));
      return ['all', ...Array.from(levels)];
    }
  }, [useBackend]);

  // Load backend courses with server-side filtering
  useEffect(() => {
    const loadBackendCourses = async () => {
      try {
        setIsLoading(true);
        
        // Prepare search parameters for server-side filtering
        const searchParams: any = {
          limit: 100
        };

        // Add search query if provided
        if (searchTerm.trim()) {
          searchParams.query = searchTerm.trim();
        }

        // Add level filter (course level)
        if (courseLevel !== 'all') {
          searchParams.level = courseLevel;
        }

        // Add price range filters
        if (tuitionRange[0] > 0) {
          searchParams.minPrice = tuitionRange[0];
        }
        if (tuitionRange[1] < 50000) {
          searchParams.maxPrice = tuitionRange[1];
        }

        // Use searchCourses API for server-side filtering
        // If no search parameters, first try to get all courses
        let response;
        if (!searchTerm && courseLevel === 'all' && tuitionRange[0] === 0 && tuitionRange[1] === 50000) {
          response = await apiService.getCourses({ limit: 100 });
        } else {
          response = await apiService.searchCourses(searchParams);
        }
        
        if (response.success) {
          // Handle different response structures
          let coursesData = [];
          if (response.data.results) {
            // Search API response
            coursesData = response.data.results;
          } else if (response.data.courses) {
            // Get courses API response
            coursesData = response.data.courses;
          }
          
          // Transform backend course data to match frontend Course type
          const transformedCourses = coursesData?.map((course: any) => ({
            uniqueId: course.course_id || course._id,
            courseName: course.title,
            courseCode: course.course_id,
            universityCode: 'backend',
            universityName: course.instructor,
            departmentSchool: course.category,
            disciplineMajor: course.category,
            courseLevel: course.level || 'Beginner',
            overviewDescription: course.description,
            summary: course.description,
            prerequisites: [],
            learningOutcomes: [],
            teachingMethodology: '',
            assessmentMethods: [],
            credits: 0,
            durationMonths: parseInt(course.duration?.replace(/\D/g, '') || '0'),
            languageOfInstruction: course.language || 'English',
            keywords: course.tags || [],
            firstYearTuitionFee: course.price || 0,
            totalTuitionFee: course.price || 0,
            tuitionFeeCurrency: 'USD',
            applicationFeeAmount: 0,
            applicationFeeCurrency: 'USD',
            applicationFeeWaived: false,
            requiredApplicationMaterials: '',
            greRequired: false,
            gmatRequired: false,
            satRequired: false,
            actRequired: false,
            partnerCourse: false,
            domesticApplicationDeadline: new Date().toISOString(),
            internationalApplicationDeadline: new Date().toISOString(),
            courseUrl: `#course-${course.course_id || course._id}`, // Use hash for modal
            attendanceType: 'Full-time' as const,
            admissionOpenYears: new Date().getFullYear().toString(),
            openForIntake: 'Yes'
          })) || [];
          
          setBackendCourses(transformedCourses);
        }
      } catch (error) {
        console.error('Error loading backend courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (useBackend) {
      // Add debounce for search term to prevent too many API calls
      const timeoutId = setTimeout(() => {
        loadBackendCourses();
      }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other filters

      return () => clearTimeout(timeoutId);
    }
  }, [useBackend, searchTerm, courseLevel, tuitionRange]);

  const filteredCourses = useMemo(() => {
    if (useBackend) {
      // For backend courses, filtering is done server-side, so return courses as-is
      return backendCourses;
    } else {
      // For sample data, apply client-side filtering
      const filtered = courses.filter((course) => {
        const university = universities.find(uni => uni.uniqueCode === course.universityCode);
        return (
          (course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.overviewDescription.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (selectedUniversity === 'all' || course.universityCode === selectedUniversity) &&
          (course.firstYearTuitionFee >= tuitionRange[0] && course.firstYearTuitionFee <= tuitionRange[1]) &&
          (courseLevel === 'all' || course.courseLevel === courseLevel)
        );
      });
      return filtered;
    }
  }, [searchTerm, selectedUniversity, tuitionRange, courseLevel, backendCourses, useBackend]);

  return (
    <div className="bg-background text-foreground">
      <section className="text-center py-20 px-4 bg-card border-b">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-primary">
          Find Your Perfect Course
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Navigate the world of education with Course Compass. Search thousands of courses from top universities to find the one that's right for you.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#search">
              <Compass className="mr-2" /> Start Exploring
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/course-match">
              <Sparkles className="mr-2" /> AI Course Match
            </Link>
          </Button>
        </div>
      </section>

      <section id="search" className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="p-6 rounded-lg bg-card shadow-sm sticky top-24">
              <h3 className="font-headline text-2xl font-semibold mb-6 flex items-center gap-2 text-primary">
                <SlidersHorizontal />
                Filters
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="search-term" className="text-sm font-medium">Search by Keyword</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search-term"
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="university" className="text-sm font-medium">University</label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger id="university" className="w-full mt-2">
                      <SelectValue placeholder="Select University" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Universities</SelectItem>
                      {universityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="course-level" className="text-sm font-medium">Course Level</label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger id="course-level" className="w-full mt-2">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseLevels.map((level) => (
                        <SelectItem key={level} value={level} className="capitalize">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Max. 1st Year Tuition ({courses[0]?.tuitionFeeCurrency || 'USD'})
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      min={0}
                      max={50000}
                      step={1000}
                      value={[tuitionRange[1]]}
                      onValueChange={(value) => setTuitionRange([tuitionRange[0], value[0]])}
                    />
                  </div>
                  <div className="text-right text-sm text-muted-foreground mt-1">
                    Up to ${tuitionRange[1].toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-3xl font-bold text-primary">
                {filteredCourses.length} Courses Found
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Data Source:</span>
                <Button
                  variant={useBackend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseBackend(true)}
                  disabled={isLoading}
                >
                  Backend API
                </Button>
                <Button
                  variant={!useBackend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseBackend(false)}
                >
                  Sample Data
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading courses...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div key={course.uniqueId} onClick={() => openCourseDetails(course)} className="cursor-pointer">
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}
            {filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center bg-card rounded-lg p-12 h-full">
                <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-primary">No Courses Found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Course Details Modal */}
      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedCourse?.courseName}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {selectedCourse?.universityName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              {/* Course Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Overview</h3>
                <p className="text-muted-foreground">{selectedCourse.overviewDescription}</p>
              </div>

              {/* Course Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedCourse.courseLevel}</Badge>
                    <Badge variant="outline">{selectedCourse.durationMonths} months</Badge>
                    <Badge variant="outline">{selectedCourse.languageOfInstruction}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="font-semibold">
                        {selectedCourse.firstYearTuitionFee.toLocaleString()} {selectedCourse.tuitionFeeCurrency} / year
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-accent" />
                      <span>Int'l Deadline: {new Date(selectedCourse.internationalApplicationDeadline).toLocaleDateString('en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent" />
                      <span>Attendance: {selectedCourse.attendanceType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Department</h4>
                    <p className="text-sm text-muted-foreground">{selectedCourse.departmentSchool}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Discipline</h4>
                    <p className="text-sm text-muted-foreground">{selectedCourse.disciplineMajor}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={closeCourseDetails} variant="outline">
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/courses/${selectedCourse.courseCode}`}>
                    View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
