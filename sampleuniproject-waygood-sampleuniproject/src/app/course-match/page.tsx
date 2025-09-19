'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Star, Clock, DollarSign, User, BookOpen, Zap } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  title: string;
  description: string;
  category: string;
  skillLevel: string;
  duration: string;
  instructor: string;
  rating: number;
  price: string;
  whyRecommended: string;
}

interface RecommendationResponse {
  userPreferences: {
    topics: string[];
    skillLevel: string;
    duration: string;
    interests: string[];
  };
  recommendations: Recommendation[];
  totalRecommendations: number;
  generatedAt: string;
  note?: string;
}

export default function CourseMatchPage() {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [duration, setDuration] = useState('10-20 hours');
  const [interests, setInterests] = useState<string[]>([]);
  const [currentInterest, setCurrentInterest] = useState('');

  const addTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  const addInterest = () => {
    if (currentInterest.trim() && !interests.includes(currentInterest.trim())) {
      setInterests([...interests, currentInterest.trim()]);
      setCurrentInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (topics.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please add at least one topic of interest.',
      });
      return;
    }

    setIsLoading(true);
    setRecommendations(null);

    try {
      const response = await apiService.getRecommendations({
        topics,
        skillLevel,
        duration,
        interests
      });

      if (response.success) {
        setRecommendations(response.data);
        toast({
          title: 'Recommendations Generated!',
          description: `Found ${response.data.totalRecommendations} courses that match your preferences.`,
          duration: 3000,
        });
      } else {
        throw new Error(response.message || 'Failed to get recommendations');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to generate recommendations. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleRecommendations = async () => {
    setIsLoading(true);
    setRecommendations(null);

    try {
      const response = await apiService.getSampleRecommendations();
      if (response.success) {
        setRecommendations(response.data);
        toast({
          title: 'Sample Recommendations Loaded!',
          description: 'Here are some example course recommendations.',
          duration: 3000,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load sample recommendations.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="text-center mb-12">
          <Sparkles className="mx-auto h-12 w-12 text-accent mb-4" />
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            AI Course Recommendations
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tell us about your interests and skill level, and our AI will recommend the perfect courses for you.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Your Learning Preferences
            </CardTitle>
            <CardDescription>
              Fill in your preferences to get personalized course recommendations powered by Gemini AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topics */}
              <div className="space-y-2">
                <Label htmlFor="topics">Topics of Interest *</Label>
                <div className="flex gap-2">
                  <Input
                    id="topics"
                    placeholder="e.g., Web Development, Data Science, Machine Learning"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                  <Button type="button" onClick={addTopic} variant="outline">
                    Add
                  </Button>
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select value={skillLevel} onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => setSkillLevel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Preferred Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10 hours">5-10 hours</SelectItem>
                    <SelectItem value="10-20 hours">10-20 hours</SelectItem>
                    <SelectItem value="20-30 hours">20-30 hours</SelectItem>
                    <SelectItem value="30+ hours">30+ hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label htmlFor="interests">Additional Interests (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="interests"
                    placeholder="e.g., Frontend Development, React, Python"
                    value={currentInterest}
                    onChange={(e) => setCurrentInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" onClick={addInterest} variant="outline">
                    Add
                  </Button>
                </div>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="flex items-center gap-1">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Recommendations...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Get AI Recommendations
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={loadSampleRecommendations} disabled={isLoading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try Sample
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {recommendations && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-headline text-3xl font-bold mb-2 text-primary">
                Your Personalized Recommendations
              </h2>
              <p className="text-muted-foreground">
                Found {recommendations.totalRecommendations} courses that match your preferences
              </p>
              {recommendations.note && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {recommendations.note}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.recommendations.map((rec, index) => (
                <Card key={index} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {rec.category}
                      </Badge>
                      <Badge variant={rec.skillLevel === 'Advanced' ? 'destructive' : rec.skillLevel === 'Intermediate' ? 'default' : 'secondary'}>
                        {rec.skillLevel}
                      </Badge>
                    </div>
                    <CardTitle className="font-headline text-lg line-clamp-2">{rec.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{rec.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {rec.instructor}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {rec.rating}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {rec.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {rec.price}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <span className="font-semibold text-primary">Why Recommended:</span>{' '}
                        {rec.whyRecommended}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
