const mongoose = require('mongoose');

const skillVerificationSchema = new mongoose.Schema({
  // User and Skill
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  
  // Verification method
  verificationMethod: {
    type: String,
    enum: ['quiz', 'portfolio', 'peer_review', 'expert_review', 'endorsement'],
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in_review', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Quiz verification
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      userAnswer: Number,
      isCorrect: Boolean
    }],
    score: Number,
    passingScore: { type: Number, default: 70 },
    passed: Boolean,
    completedAt: Date
  },
  
  // Portfolio verification
  portfolio: {
    items: [{
      title: String,
      description: String,
      url: String,
      imageUrl: String,
      type: {
        type: String,
        enum: ['project', 'certificate', 'work_sample', 'link']
      }
    }],
    reviewNotes: String
  },
  
  // Peer review verification
  peerReview: {
    reviewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      reviewedAt: Date
    }],
    requiredReviews: { type: Number, default: 3 },
    averageRating: Number,
    minimumRating: { type: Number, default: 4 }
  },
  
  // Expert review verification
  expertReview: {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    credentials: String,
    reviewedAt: Date
  },
  
  // Endorsements
  endorsements: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    relationship: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Verification result
  verifiedAt: Date,
  expiresAt: Date, // Some verifications may expire
  
  // Reviewer notes
  reviewerNotes: String,
  rejectionReason: String,
  
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
skillVerificationSchema.index({ user: 1, skill: 1 });
skillVerificationSchema.index({ status: 1, createdAt: -1 });
skillVerificationSchema.index({ verificationMethod: 1 });

// Calculate quiz score
skillVerificationSchema.methods.calculateQuizScore = function() {
  if (!this.quiz || !this.quiz.questions || this.quiz.questions.length === 0) {
    return 0;
  }
  
  const correct = this.quiz.questions.filter(q => q.isCorrect).length;
  const total = this.quiz.questions.length;
  const score = Math.round((correct / total) * 100);
  
  this.quiz.score = score;
  this.quiz.passed = score >= this.quiz.passingScore;
  
  return score;
};

// Calculate peer review average
skillVerificationSchema.methods.calculatePeerReviewAverage = function() {
  if (!this.peerReview || !this.peerReview.reviewers || this.peerReview.reviewers.length === 0) {
    return 0;
  }
  
  const ratings = this.peerReview.reviewers.map(r => r.rating).filter(r => r != null);
  if (ratings.length === 0) return 0;
  
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  this.peerReview.averageRating = Math.round(average * 10) / 10;
  
  return this.peerReview.averageRating;
};

// Check if verification is complete
skillVerificationSchema.methods.checkCompletion = function() {
  switch (this.verificationMethod) {
    case 'quiz':
      if (this.quiz && this.quiz.passed) {
        this.status = 'verified';
        this.verifiedAt = new Date();
        // Certificates expire after 2 years
        this.expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
      } else if (this.quiz && !this.quiz.passed) {
        this.status = 'rejected';
        this.rejectionReason = `Quiz score ${this.quiz.score}% is below passing score ${this.quiz.passingScore}%`;
      }
      break;
      
    case 'peer_review':
      if (this.peerReview && this.peerReview.reviewers.length >= this.peerReview.requiredReviews) {
        const avgRating = this.calculatePeerReviewAverage();
        if (avgRating >= this.peerReview.minimumRating) {
          this.status = 'verified';
          this.verifiedAt = new Date();
        } else {
          this.status = 'rejected';
          this.rejectionReason = `Average rating ${avgRating} is below minimum ${this.peerReview.minimumRating}`;
        }
      }
      break;
      
    case 'expert_review':
      if (this.expertReview && this.expertReview.rating) {
        if (this.expertReview.rating >= 4) {
          this.status = 'verified';
          this.verifiedAt = new Date();
        } else {
          this.status = 'rejected';
          this.rejectionReason = `Expert rating ${this.expertReview.rating} is below minimum 4`;
        }
      }
      break;
      
    case 'portfolio':
      // Manually reviewed, status set by reviewer
      break;
      
    case 'endorsement':
      // Auto-verify if 5+ endorsements
      if (this.endorsements && this.endorsements.length >= 5) {
        this.status = 'verified';
        this.verifiedAt = new Date();
      }
      break;
  }
};

const SkillVerification = mongoose.model('SkillVerification', skillVerificationSchema);

module.exports = SkillVerification;