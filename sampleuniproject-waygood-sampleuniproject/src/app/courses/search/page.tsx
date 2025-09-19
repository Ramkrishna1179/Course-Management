'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, Star, Clock, DollarSign, User, BookOpen, Loader2, SortAsc, SortDesc } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
  level: string;
  thumbnail?: string;
}

interface SearchResults {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CourseSearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // search parameters
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: 'all',
    instructor: 'all',
    level: 'all',
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    sortBy: 'rating',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });

  // Available options for filters
  const [categories, setCategories] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Trigger search when searchParams change
  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const loadInitialData = async () => {
    try {
      // Load filter options
      const [categoriesRes, instructorsRes, levelsRes] = await Promise.all([
        apiService.getCourses({ limit: 1, groupBy: 'category' }),
        apiService.getCourses({ limit: 1, groupBy: 'instructor' }),
        apiService.getCourses({ limit: 1, groupBy: 'level' })
      ]);

      if (categoriesRes.success) {
        const categories = categoriesRes.data.categories || [];
        setCategories(categories.filter(cat => cat && cat.trim() !== ''));
      }
      if (instructorsRes.success) {
        const instructors = instructorsRes.data.instructors || [];
        setInstructors(instructors.filter(inst => inst && inst.trim() !== ''));
      }
      if (levelsRes.success) {
        const levels = levelsRes.data.levels || [];
        setLevels(levels.filter(level => level && level.trim() !== ''));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      // Convert "all" values to empty strings for the API
      const apiParams = {
        ...searchParams,
        category: searchParams.category === 'all' ? '' : searchParams.category,
        instructor: searchParams.instructor === 'all' ? '' : searchParams.instructor,
        level: searchParams.level === 'all' ? '' : searchParams.level,
      };
      
      const response = await apiService.searchCourses(apiParams);
      
      if (response.success) {
        // Ensure the response has the expected structure
        const searchData = response.data || response;
        setSearchResults({
          courses: searchData.courses || searchData.results || [],
          total: searchData.total || searchData.count || 0,
          page: searchData.page || searchData.currentPage || 1,
          totalPages: searchData.totalPages || searchData.pages || 1,
          hasNextPage: searchData.hasNextPage || false,
          hasPrevPage: searchData.hasPrevPage || false
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Search Error',
          description: response.message || 'Failed to search courses',
        });
        setSearchResults(null);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: error.message || 'Failed to search courses',
      });
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    // Convert "all" values to empty strings for the API
    const filterValue = value === "all" ? "" : value;
    setSearchParams(prev => ({ ...prev, [key]: filterValue, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchParams({
      query: '',
      category: 'all',
      instructor: 'all',
      level: 'all',
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      sortBy: 'rating',
      sortOrder: 'desc',
      page: 1,
      limit: 12
    });
  };

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4">
            Course Search
          </h1>
          <p className="text-lg text-muted-foreground">
            Find the perfect course using our advanced search powered by Elasticsearch
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Search Courses
            </CardTitle>
            <CardDescription>
              Use the search form below to find courses that match your interests and requirements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Main Search */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="query">Search Keywords</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="query"
                      placeholder="Search by course title, description, or keywords..."
                      value={searchParams.query}
                      onChange={(e) => handleFilterChange('query', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  {/* Category Filter */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={searchParams.category}
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.filter(category => category && category.trim() !== '').map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instructor Filter */}
                  <div>
                    <Label htmlFor="instructor">Instructor</Label>
                    <Select
                      value={searchParams.instructor}
                      onValueChange={(value) => handleFilterChange('instructor', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Instructors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Instructors</SelectItem>
                        {instructors.filter(instructor => instructor && instructor.trim() !== '').map((instructor) => (
                          <SelectItem key={instructor} value={instructor}>
                            {instructor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level Filter */}
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={searchParams.level}
                      onValueChange={(value) => handleFilterChange('level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.filter(level => level && level.trim() !== '').map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <Label htmlFor="sortBy">Sort By</Label>
                    <div className="flex gap-2">
                      <Select
                        value={searchParams.sortBy}
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Rating</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="title">Title</SelectItem>
                          <SelectItem value="duration">Duration</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('sortOrder', 
                          searchParams.sortOrder === 'desc' ? 'asc' : 'desc'
                        )}
                      >
                        {searchParams.sortOrder === 'desc' ? (
                          <SortDesc className="h-4 w-4" />
                        ) : (
                          <SortAsc className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="md:col-span-2">
                    <Label>Price Range: ${searchParams.minPrice} - ${searchParams.maxPrice}</Label>
                    <div className="flex gap-4 mt-2">
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        value={[searchParams.minPrice, searchParams.maxPrice]}
                        onValueChange={([min, max]) => {
                          handleFilterChange('minPrice', min);
                          handleFilterChange('maxPrice', max);
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <Label>Minimum Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <Slider
                        min={0}
                        max={5}
                        step={0.5}
                        value={[searchParams.minRating]}
                        onValueChange={([value]) => handleFilterChange('minRating', value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">{searchParams.minRating}</span>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Searching courses...</p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary">
                  Search Results
                </h2>
                <p className="text-muted-foreground">
                  Found {searchResults.total} courses
                  {searchParams.query && ` for "${searchParams.query}"`}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {searchResults.page} of {searchResults.totalPages}
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.courses && searchResults.courses.length > 0 ? searchResults.courses.map((course) => (
                <Card key={course._id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                      <Badge variant={course.level === 'Advanced' ? 'destructive' : course.level === 'Intermediate' ? 'default' : 'secondary'}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardTitle className="font-headline text-lg line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {course.instructor}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {course.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${course.price}
                      </div>
                    </div>
                    
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.course_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-primary mb-2">No Courses Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters to find more courses.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {searchResults.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchResults.page - 1)}
                  disabled={!searchResults.hasPrevPage}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(5, searchResults.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === searchResults.page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchResults.page + 1)}
                  disabled={!searchResults.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
