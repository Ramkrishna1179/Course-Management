const mongoose = require('mongoose');

// course schema definition
const courseSchema = new mongoose.Schema({
  course_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  instructor: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  studentsEnrolled: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Essential indexes for performance
courseSchema.index({ title: 'text', description: 'text', category: 'text', instructor: 'text' });
courseSchema.index({ course_id: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ rating: -1 });

courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Course', courseSchema);
