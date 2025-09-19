const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseURL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateRecommendations(userPreferences) {
    try {
      const { topics, skillLevel, duration, interests } = userPreferences;
      
      const prompt = this.buildPrompt(topics, skillLevel, duration, interests);
      
      // fallback to mock data if api key not set
      if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
        console.log('Using mock recommendations (API key not configured)');
        return this.getMockRecommendations(userPreferences);
      }

      const response = await axios.post(
        `${this.baseURL}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.parseRecommendations(generatedText);

    } catch (error) {
      console.error('Gemini API Error:', error.message);
      return this.getMockRecommendations(userPreferences);
    }
  }

  buildPrompt(topics, skillLevel, duration, interests) {
    return `You are an AI course recommendation expert. Based on the user's preferences, recommend 5 relevant courses.

User Preferences:
- Topics: ${topics.join(', ')}
- Skill Level: ${skillLevel}
- Preferred Duration: ${duration}
- Interests: ${interests.join(', ')}

Please provide course recommendations in the following JSON format:
{
  "recommendations": [
    {
      "title": "Course Title",
      "description": "Brief course description",
      "category": "Course category",
      "skillLevel": "Beginner/Intermediate/Advanced",
      "duration": "X hours",
      "instructor": "Instructor Name",
      "rating": 4.5,
      "price": "$99",
      "whyRecommended": "Why this course matches the user's preferences"
    }
  ]
}

Make the recommendations relevant, practical, and diverse. Focus on courses that match the user's skill level and interests.`;
  }

  parseRecommendations(generatedText) {
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found');
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.getMockRecommendations();
    }
  }

  getMockRecommendations(userPreferences = {}) {
    const { topics = ['Web Development'], skillLevel = 'Beginner', duration = '10-20 hours' } = userPreferences;
    
    const mockCourses = [
      {
        title: `Complete ${topics[0]} Course for ${skillLevel}s`,
        description: `Master ${topics[0]} from basics to advanced concepts with hands-on projects and real-world examples.`,
        category: topics[0],
        skillLevel: skillLevel,
        duration: duration,
        instructor: "John Smith",
        rating: 4.7,
        price: "$89",
        whyRecommended: `Perfect for ${skillLevel.toLowerCase()} level learners interested in ${topics[0]}.`
      },
      {
        title: `${topics[0]} Fundamentals`,
        description: `Learn the core concepts and best practices of ${topics[0]} through interactive lessons.`,
        category: topics[0],
        skillLevel: skillLevel,
        duration: duration,
        instructor: "Sarah Johnson",
        rating: 4.5,
        price: "$79",
        whyRecommended: `Comprehensive coverage of ${topics[0]} fundamentals suitable for your skill level.`
      },
      {
        title: `Advanced ${topics[0]} Techniques`,
        description: `Dive deep into advanced ${topics[0]} concepts and industry-standard practices.`,
        category: topics[0],
        skillLevel: skillLevel,
        duration: duration,
        instructor: "Mike Chen",
        rating: 4.8,
        price: "$129",
        whyRecommended: `Advanced course that will challenge and expand your ${topics[0]} knowledge.`
      },
      {
        title: `${topics[0]} Project-Based Learning`,
        description: `Build real-world projects while learning ${topics[0]} concepts and best practices.`,
        category: topics[0],
        skillLevel: skillLevel,
        duration: duration,
        instructor: "Emily Davis",
        rating: 4.6,
        price: "$99",
        whyRecommended: `Hands-on approach perfect for practical learners at ${skillLevel.toLowerCase()} level.`
      },
      {
        title: `${topics[0]} Masterclass`,
        description: `Comprehensive ${topics[0]} course covering everything from basics to advanced topics.`,
        category: topics[0],
        skillLevel: skillLevel,
        duration: duration,
        instructor: "Alex Rodriguez",
        rating: 4.9,
        price: "$149",
        whyRecommended: `Complete learning path for ${topics[0]} that matches your preferences perfectly.`
      }
    ];

    return {
      recommendations: mockCourses,
      note: "Mock recommendations for testing - replace with real AI in production"
    };
  }
}

module.exports = new GeminiService();
