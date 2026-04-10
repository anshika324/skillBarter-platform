const SkillVerification = require('../models/SkillVerification');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Skill = require('../models/Skill');

class VerificationService {
  
  // Generate quiz questions for a skill
  static generateQuiz(skillOrCategory, difficulty = 'medium') {
    const skill = typeof skillOrCategory === 'string'
      ? { category: skillOrCategory }
      : (skillOrCategory || {});

    const technicalQuestionBanks = {
      web_development: [
        {
          section: 'technical',
          question: 'Which HTTP method is typically used to partially update a resource?',
          options: ['GET', 'POST', 'PATCH', 'DELETE'],
          correctAnswer: 2
        },
        {
          section: 'technical',
          question: 'In React, what is the primary purpose of the `useEffect` hook?',
          options: ['Style components', 'Manage side effects', 'Create routes', 'Define props'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which status code indicates that the client request was malformed?',
          options: ['200', '301', '400', '500'],
          correctAnswer: 2
        },
        {
          section: 'technical',
          question: 'What does normalization in database design primarily reduce?',
          options: ['Latency', 'Redundant data', 'CPU usage', 'Bundle size'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which practice helps prevent SQL injection attacks?',
          options: ['Parameterized queries', 'Increasing RAM', 'Using GET requests', 'Client-side validation only'],
          correctAnswer: 0
        }
      ],
      programming: [
        {
          section: 'technical',
          question: 'What is the average time complexity of binary search on a sorted array?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which concept allows the same function name to have multiple implementations?',
          options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'],
          correctAnswer: 2
        },
        {
          section: 'technical',
          question: 'What does immutability mean in programming?',
          options: ['Variables can change anytime', 'Data cannot be changed after creation', 'Data is always encrypted', 'Code cannot be compiled'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which data structure uses FIFO ordering?',
          options: ['Stack', 'Queue', 'Tree', 'Graph'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'What is a common use of unit tests?',
          options: ['Load balancing', 'Checking isolated logic behavior', 'Deploying to production', 'Minifying CSS'],
          correctAnswer: 1
        }
      ],
      design: [
        {
          section: 'technical',
          question: 'Which color model is primarily used for digital displays?',
          options: ['CMYK', 'RGB', 'Pantone', 'HSB'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'What does WCAG focus on?',
          options: ['Web animations', 'Accessibility standards', 'Database indexing', 'Version control'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which principle helps users quickly identify interactive elements?',
          options: ['Affordance', 'Kerning', 'Bleed', 'Rasterization'],
          correctAnswer: 0
        },
        {
          section: 'technical',
          question: 'In typography, what does line-height mainly control?',
          options: ['Font weight', 'Vertical spacing between lines', 'Letter spacing only', 'Text color'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'A wireframe is best described as:',
          options: ['Final polished design', 'Low-fidelity layout structure', '3D model', 'Code documentation'],
          correctAnswer: 1
        }
      ],
      data: [
        {
          section: 'technical',
          question: 'What is overfitting in machine learning?',
          options: ['Model performs well on training but poorly on new data', 'Model has too little data', 'Model uses SQL joins', 'Model cannot compile'],
          correctAnswer: 0
        },
        {
          section: 'technical',
          question: 'Which metric is commonly used for classification problems?',
          options: ['RMSE', 'Accuracy', 'MAE', 'R-squared'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'What does ETL stand for?',
          options: ['Extract, Transform, Load', 'Evaluate, Test, Learn', 'Encode, Train, Label', 'Export, Track, Link'],
          correctAnswer: 0
        },
        {
          section: 'technical',
          question: 'Which chart is best for showing trends over time?',
          options: ['Pie chart', 'Line chart', 'Scatter chart', 'Heatmap'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'In SQL, which clause is used to filter grouped results?',
          options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
          correctAnswer: 1
        }
      ],
      marketing: [
        {
          section: 'technical',
          question: 'What does CTR stand for in digital marketing?',
          options: ['Click-Through Rate', 'Customer Trend Ratio', 'Conversion Time Rate', 'Content Tracking Reach'],
          correctAnswer: 0
        },
        {
          section: 'technical',
          question: 'Which metric directly measures campaign conversions?',
          options: ['Impressions', 'Bounce rate', 'Conversion rate', 'Follower count'],
          correctAnswer: 2
        },
        {
          section: 'technical',
          question: 'SEO primarily aims to improve:',
          options: ['Paid ad spend', 'Organic search visibility', 'Server uptime', 'Email deliverability'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'A/B testing is used to:',
          options: ['Clone databases', 'Compare two variants for performance', 'Generate logos', 'Compress images'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which stage is closest to the bottom of a marketing funnel?',
          options: ['Awareness', 'Interest', 'Consideration', 'Conversion'],
          correctAnswer: 3
        }
      ],
      language: [
        {
          section: 'technical',
          question: 'Which CEFR level represents advanced proficiency?',
          options: ['A1', 'A2', 'B1', 'C1'],
          correctAnswer: 3
        },
        {
          section: 'technical',
          question: 'Which is a core component of communicative language teaching?',
          options: ['Memorizing only grammar rules', 'Real-life context practice', 'Avoiding speaking', 'No feedback'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'What is code-switching?',
          options: ['Switching keyboard layout', 'Alternating between languages in communication', 'Compiling translated code', 'Editing subtitles'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which activity most directly improves listening comprehension?',
          options: ['Vocabulary flashcards only', 'Exposure to native audio with guided tasks', 'Silent reading only', 'Spell-check exercises'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Formative assessment is best described as:',
          options: ['End-of-course certification only', 'Ongoing feedback during learning', 'Random grading', 'Attendance tracking only'],
          correctAnswer: 1
        }
      ],
      teaching: [
        {
          section: 'technical',
          question: 'What is the primary purpose of a lesson objective?',
          options: ['Decorate slides', 'Define measurable learning outcomes', 'Replace assessments', 'Avoid planning'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Bloom’s taxonomy helps educators:',
          options: ['Track attendance', 'Design learning goals at cognitive levels', 'Set tuition fees', 'Create logos'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which strategy best supports active learning?',
          options: ['One-way lecturing only', 'Peer discussion and applied tasks', 'Skipping feedback', 'Removing exercises'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Rubrics are primarily used to:',
          options: ['Grade inconsistently', 'Provide transparent assessment criteria', 'Replace instructions', 'Manage billing'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which practice improves learner retention most?',
          options: ['Single long lecture', 'Spaced repetition and retrieval practice', 'No revision', 'Random topic jumps'],
          correctAnswer: 1
        }
      ],
      general_technical: [
        {
          section: 'technical',
          question: 'Which practice improves reliability before release?',
          options: ['Skipping tests', 'Version control and testing', 'Deploying directly to production only', 'Removing logs'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'A good problem statement should be:',
          options: ['Vague', 'Specific and measurable', 'Unrelated to outcomes', 'Only visual'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'What is a key benefit of documentation?',
          options: ['Increases confusion', 'Improves maintainability and onboarding', 'Replaces testing', 'Prevents collaboration'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Which method helps evaluate quality objectively?',
          options: ['Guesswork', 'Defined criteria and metrics', 'No review process', 'Random voting'],
          correctAnswer: 1
        },
        {
          section: 'technical',
          question: 'Iterative improvement means:',
          options: ['Never changing approach', 'Repeatedly refining based on feedback', 'Avoiding measurement', 'Only final-stage testing'],
          correctAnswer: 1
        }
      ]
    };

    const professionalQuestions = [
      {
        section: 'professional',
        question: 'How many years of experience do you have in this skill?',
        options: ['Less than 1 year', '1-2 years', '3-5 years', '5+ years']
      },
      {
        section: 'professional',
        question: 'Have you completed professional projects in this skill?',
        options: ['No', '1-2 projects', '3-5 projects', '5+ projects']
      },
      {
        section: 'professional',
        question: 'Do you stay updated with latest trends in this field?',
        options: ['Rarely', 'Sometimes', 'Often', 'Always']
      }
    ];

    const domain = this.inferQuizDomain(skill);
    const technicalQuestions = technicalQuestionBanks[domain] || technicalQuestionBanks.general_technical;

    return {
      technicalQuestions,
      professionalQuestions
    };
  }

  static inferQuizDomain(skill) {
    const source = [
      skill.title || '',
      skill.category || '',
      skill.description || '',
      ...(Array.isArray(skill.tags) ? skill.tags : [])
    ]
      .join(' ')
      .toLowerCase();

    if (
      /(full\s*stack|frontend|front-end|backend|back-end|react|node|express|html|css|javascript|typescript|api|mongodb|sql|web)/.test(source) ||
      /(programming\s*&\s*tech)/.test(source)
    ) {
      return 'web_development';
    }

    if (/(programming|software|java|python|c\+\+|golang|oop|algorithm|data structure)/.test(source)) {
      return 'programming';
    }

    if (/(design|ui|ux|figma|photoshop|illustrator|typography|branding|creative)/.test(source)) {
      return 'design';
    }

    if (/(data|analytics|machine learning|ml|ai|statistics|sql|tableau|power bi)/.test(source)) {
      return 'data';
    }

    if (/(marketing|seo|sem|social media|content|copywriting|growth|business)/.test(source)) {
      return 'marketing';
    }

    if (/(language|english|spanish|french|german|hindi|communication)/.test(source)) {
      return 'language';
    }

    if (/(teaching|academics|tutor|education|curriculum|lesson)/.test(source)) {
      return 'teaching';
    }

    return 'general_technical';
  }

  // Submit quiz for verification
  static async submitQuiz(userId, skillId, answers) {
    try {
      // Find or create verification
      let verification = await SkillVerification.findOne({
        user: userId,
        skill: skillId,
        verificationMethod: 'quiz',
        status: { $in: ['pending', 'in_review'] }
      });

      if (!verification) {
        const skill = await Skill.findById(skillId);
        const { technicalQuestions } = this.generateQuiz(skill);
        
        verification = new SkillVerification({
          user: userId,
          skill: skillId,
          verificationMethod: 'quiz',
          status: 'in_review',
          quiz: {
            questions: technicalQuestions.map((q, index) => ({
              ...q,
              userAnswer: answers[index],
              isCorrect: answers[index] === q.correctAnswer
            })),
            passingScore: 70
          }
        });
      } else {
        // Update answers
        verification.quiz.questions.forEach((q, index) => {
          q.userAnswer = answers[index];
          q.isCorrect = answers[index] === q.correctAnswer;
        });
      }

      // Calculate score
      verification.calculateQuizScore();
      verification.quiz.completedAt = new Date();
      
      // Check if passed
      verification.checkCompletion();
      
      await verification.save();

      // If verified, create certificate
      if (verification.status === 'verified') {
        await this.createCertificate(verification);
      }

      return verification;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  // Request peer review
  static async requestPeerReview(userId, skillId) {
    try {
      const verification = new SkillVerification({
        user: userId,
        skill: skillId,
        verificationMethod: 'peer_review',
        status: 'pending',
        peerReview: {
          requiredReviews: 3,
          minimumRating: 4,
          reviewers: []
        }
      });

      await verification.save();
      return verification;
    } catch (error) {
      console.error('Error requesting peer review:', error);
      throw error;
    }
  }

  // Submit peer review
  static async submitPeerReview(verificationId, reviewerId, rating, feedback) {
    try {
      const verification = await SkillVerification.findById(verificationId);
      
      if (!verification || verification.verificationMethod !== 'peer_review') {
        throw new Error('Invalid verification');
      }

      // Check if already reviewed
      const existingReview = verification.peerReview.reviewers.find(
        r => r.user.toString() === reviewerId.toString()
      );

      if (existingReview) {
        throw new Error('You have already reviewed this skill');
      }

      // Add review
      verification.peerReview.reviewers.push({
        user: reviewerId,
        rating,
        feedback,
        reviewedAt: new Date()
      });

      verification.status = 'in_review';
      verification.checkCompletion();
      
      await verification.save();

      // If verified, create certificate
      if (verification.status === 'verified') {
        await this.createCertificate(verification);
      }

      return verification;
    } catch (error) {
      console.error('Error submitting peer review:', error);
      throw error;
    }
  }

  // Submit portfolio for verification
  static async submitPortfolio(userId, skillId, portfolioItems) {
    try {
      const verification = new SkillVerification({
        user: userId,
        skill: skillId,
        verificationMethod: 'portfolio',
        status: 'pending',
        portfolio: {
          items: portfolioItems
        }
      });

      await verification.save();
      return verification;
    } catch (error) {
      console.error('Error submitting portfolio:', error);
      throw error;
    }
  }

  // Add endorsement
  static async addEndorsement(userId, skillId, endorserId, message, relationship) {
    try {
      let verification = await SkillVerification.findOne({
        user: userId,
        skill: skillId,
        verificationMethod: 'endorsement'
      });

      if (!verification) {
        verification = new SkillVerification({
          user: userId,
          skill: skillId,
          verificationMethod: 'endorsement',
          status: 'pending',
          endorsements: []
        });
      }

      // Check if already endorsed
      const existing = verification.endorsements.find(
        e => e.user.toString() === endorserId.toString()
      );

      if (existing) {
        throw new Error('You have already endorsed this skill');
      }

      verification.endorsements.push({
        user: endorserId,
        message,
        relationship
      });

      verification.checkCompletion();
      await verification.save();

      // If verified, create certificate
      if (verification.status === 'verified') {
        await this.createCertificate(verification);
      }

      return verification;
    } catch (error) {
      console.error('Error adding endorsement:', error);
      throw error;
    }
  }

  // Create certificate from verification
  static async createCertificate(verification) {
    try {
      await verification.populate('skill user');
      
      const certificate = new Certificate({
        certificateType: 'skill',
        user: verification.user._id,
        skill: verification.skill._id,
        verification: verification._id,
        title: `${verification.skill.title} Certificate`,
        description: `Verified proficiency in ${verification.skill.title}`,
        verificationMethod: verification.verificationMethod,
        score: verification.quiz?.score,
        rating: verification.peerReview?.averageRating || verification.expertReview?.rating,
        issuedDate: new Date(),
        expiresDate: verification.expiresAt
      });

      // Determine badge level
      certificate.badge = certificate.determineBadge();
      
      await certificate.save();

      // Update user's verified skills
      await User.findByIdAndUpdate(verification.user._id, {
        $addToSet: { verifiedSkills: verification.skill._id }
      });

      return certificate;
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  }

  // Get user's verifications
  static async getUserVerifications(userId) {
    try {
      const verifications = await SkillVerification.find({ user: userId })
        .populate('skill')
        .sort('-createdAt');

      return verifications;
    } catch (error) {
      console.error('Error getting verifications:', error);
      throw error;
    }
  }

  // Get user's certificates
  static async getUserCertificates(userId) {
    try {
      const certificates = await Certificate.find({ 
        user: userId,
        isRevoked: false
      })
        .populate('skill user learningPath')
        .sort('-issuedDate');

      return certificates;
    } catch (error) {
      console.error('Error getting certificates:', error);
      throw error;
    }
  }

  // Verify certificate by ID
  static async verifyCertificate(certificateId) {
    try {
      const certificate = await Certificate.findOne({ certificateId })
        .populate('skill user verification learningPath');

      if (!certificate) {
        return { valid: false, message: 'Certificate not found' };
      }

      const isValid = certificate.verifyAuthenticity();
      
      if (!isValid) {
        return { valid: false, message: 'Certificate is invalid or revoked' };
      }

      // Increment views
      certificate.views += 1;
      await certificate.save();

      const skillOrPathTitle = certificate.skill?.title
        || certificate.learningPath?.title
        || certificate.title;

      return {
        valid: true,
        certificate: {
          id: certificate.certificateId,
          title: certificate.title,
          recipient: `${certificate.user.firstName} ${certificate.user.lastName}`,
          skill: skillOrPathTitle,
          issuedDate: certificate.issuedDate,
          expiresDate: certificate.expiresDate,
          badge: certificate.badge,
          verificationMethod: certificate.verificationMethod,
          score: certificate.score,
          rating: certificate.rating
        }
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }
}

module.exports = VerificationService;
