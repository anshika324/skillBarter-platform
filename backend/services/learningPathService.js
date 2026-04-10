const LearningPath = require('../models/LearningPath');
const PathEnrollment = require('../models/PathEnrollment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Skill = require('../models/Skill');

class LearningPathService {
  static async ensurePublishedPathsSeeded() {
    try {
      const publishedCount = await LearningPath.countDocuments({ status: 'published' });
      if (publishedCount > 0) {
        return;
      }

      const creator = await User.findOne({ isActive: true }).select('_id');
      if (!creator) {
        return;
      }

      const now = new Date();
      const seedPaths = [
        {
          title: 'Full Stack Web Development Foundations',
          description: 'Learn HTML, CSS, JavaScript, React basics, APIs, and deployment through guided modules and mini projects.',
          category: 'Development',
          level: 'beginner',
          tags: ['web-development', 'javascript', 'react', 'api'],
          isFeatured: true,
          publishedAt: now,
          modules: [
            {
              title: 'Web Fundamentals',
              description: 'Build your core understanding of frontend development.',
              order: 1,
              lessons: [
                {
                  title: 'HTML and semantic structure',
                  description: 'Create clean and accessible page structures.',
                  type: 'reading',
                  duration: 45
                },
                {
                  title: 'Modern CSS essentials',
                  description: 'Layouts, spacing, responsive design, and utility-first workflow.',
                  type: 'exercise',
                  duration: 60
                }
              ]
            },
            {
              title: 'JavaScript and React Basics',
              description: 'Move from static pages to interactive apps.',
              order: 2,
              lessons: [
                {
                  title: 'JavaScript fundamentals',
                  description: 'Variables, functions, arrays, objects, and async basics.',
                  type: 'reading',
                  duration: 60
                },
                {
                  title: 'Build your first React page',
                  description: 'Components, props, state, and event handling.',
                  type: 'exercise',
                  duration: 75
                }
              ]
            }
          ],
          outcomes: [
            'Build responsive frontend pages',
            'Understand React fundamentals',
            'Connect UI with API endpoints'
          ]
        },
        {
          title: 'Data Analysis with Python',
          description: 'Analyze real datasets using Python, NumPy, Pandas, and visualization tools with practical case studies.',
          category: 'Data Science',
          level: 'intermediate',
          tags: ['python', 'pandas', 'analytics', 'visualization'],
          isFeatured: true,
          publishedAt: now,
          modules: [
            {
              title: 'Python for Data Work',
              description: 'Set up your data analysis workflow.',
              order: 1,
              lessons: [
                {
                  title: 'Working with NumPy arrays',
                  description: 'Fast numerical computing fundamentals.',
                  type: 'reading',
                  duration: 50
                },
                {
                  title: 'Pandas data cleaning',
                  description: 'Load, clean, and transform tabular datasets.',
                  type: 'exercise',
                  duration: 70
                }
              ]
            },
            {
              title: 'Insights and Visualization',
              description: 'Turn cleaned data into insights and charts.',
              order: 2,
              lessons: [
                {
                  title: 'Exploratory data analysis',
                  description: 'Spot trends and outliers systematically.',
                  type: 'exercise',
                  duration: 60
                },
                {
                  title: 'Visualization with Matplotlib and Seaborn',
                  description: 'Create clear and useful charts for reporting.',
                  type: 'project',
                  duration: 90
                }
              ]
            }
          ],
          outcomes: [
            'Clean and transform datasets effectively',
            'Generate actionable insights',
            'Present analysis using visualizations'
          ]
        },
        {
          title: 'Product Thinking for Builders',
          description: 'Learn how to define user problems, prioritize features, and run lightweight experiments to validate ideas.',
          category: 'Product',
          level: 'beginner',
          tags: ['product-management', 'ux', 'prioritization', 'experiments'],
          isFeatured: false,
          publishedAt: now,
          modules: [
            {
              title: 'User and Problem Discovery',
              description: 'Map user needs and define clear problem statements.',
              order: 1,
              lessons: [
                {
                  title: 'Writing strong problem statements',
                  description: 'Translate observations into focused problem definitions.',
                  type: 'reading',
                  duration: 40
                },
                {
                  title: 'Interview synthesis',
                  description: 'Extract themes and opportunities from user interviews.',
                  type: 'exercise',
                  duration: 55
                }
              ]
            },
            {
              title: 'Prioritization and Validation',
              description: 'Ship smarter by testing assumptions early.',
              order: 2,
              lessons: [
                {
                  title: 'Feature prioritization frameworks',
                  description: 'Use impact and effort to make better roadmap calls.',
                  type: 'reading',
                  duration: 45
                },
                {
                  title: 'Designing small experiments',
                  description: 'Validate risky assumptions without heavy builds.',
                  type: 'project',
                  duration: 80
                }
              ]
            }
          ],
          outcomes: [
            'Define user-centric product problems',
            'Prioritize features with clear rationale',
            'Validate ideas through rapid experiments'
          ]
        }
      ];

      for (const seedPath of seedPaths) {
        const existing = await LearningPath.findOne({ title: seedPath.title }).select('_id status publishedAt');
        if (existing) {
          if (existing.status !== 'published') {
            await LearningPath.findByIdAndUpdate(existing._id, {
              status: 'published',
              publishedAt: existing.publishedAt || now
            });
          }
          continue;
        }

        const path = new LearningPath({
          ...seedPath,
          creator: creator._id,
          status: 'published'
        });
        path.calculateTotalDuration();
        try {
          await path.save();
        } catch (error) {
          // If two requests seed at the same time, unique slug collisions can happen.
          if (error.code !== 11000) {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error seeding learning paths:', error);
    }
  }
  
  // Create learning path
  static async createPath(pathData, creatorId) {
    try {
      const path = new LearningPath({
        ...pathData,
        creator: creatorId
      });
      
      // Calculate duration
      path.calculateTotalDuration();
      
      await path.save();
      return path;
    } catch (error) {
      console.error('Error creating path:', error);
      throw error;
    }
  }

  // Get all paths with filters
  static async getPaths(filters = {}, page = 1, limit = 12) {
    try {
      await this.ensurePublishedPathsSeeded();

      const query = { status: 'published' };
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      if (filters.level) {
        query.level = filters.level;
      }
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      if (filters.isFeatured) {
        query.isFeatured = true;
      }
      
      const skip = (page - 1) * limit;
      
      const [paths, total] = await Promise.all([
        LearningPath.find(query)
          .populate('creator', 'firstName lastName avatar')
          .sort(filters.sort || '-createdAt')
          .skip(skip)
          .limit(limit),
        LearningPath.countDocuments(query)
      ]);
      
      return {
        paths,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting paths:', error);
      throw error;
    }
  }

  // Get path by ID or slug
  static async getPath(identifier) {
    try {
      const query = identifier.match(/^[0-9a-fA-F]{24}$/)
        ? { _id: identifier }
        : { slug: identifier };
      
      const path = await LearningPath.findOne(query)
        .populate('creator', 'firstName lastName avatar bio')
        .populate('prerequisites.skills')
        .populate('prerequisites.paths', 'title slug');
      
      return path;
    } catch (error) {
      console.error('Error getting path:', error);
      throw error;
    }
  }

  // Enroll in path
  static async enrollInPath(userId, pathId) {
    try {
      // Check if already enrolled
      let enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (enrollment) {
        return enrollment;
      }

      const path = await LearningPath.findById(pathId).select('status isPremium price stats prerequisites title');
      if (!path) {
        throw new Error('Learning path not found');
      }

      if (path.status !== 'published') {
        throw new Error('This learning path is not available for enrollment');
      }

      const requiredPaths = path.prerequisites?.paths || [];
      if (requiredPaths.length > 0) {
        const completedPrerequisites = await PathEnrollment.countDocuments({
          user: userId,
          path: { $in: requiredPaths },
          status: 'completed'
        });

        if (completedPrerequisites < requiredPaths.length) {
          throw new Error('Complete required prerequisite learning paths before enrolling.');
        }
      }

      let user = null;
      const requiredSkills = path.prerequisites?.skills || [];
      if (requiredSkills.length > 0 || (path.isPremium && path.price > 0)) {
        user = await User.findById(userId).select('timeCredits verifiedSkills');
        if (!user) {
          throw new Error('User not found');
        }
      }

      if (requiredSkills.length > 0) {
        const verifiedSkillIds = new Set(
          (user.verifiedSkills || []).map((skillId) => skillId.toString())
        );
        const missingSkills = requiredSkills.filter(
          (skillId) => !verifiedSkillIds.has(skillId.toString())
        );

        if (missingSkills.length > 0) {
          throw new Error('Complete required prerequisite skills before enrolling.');
        }
      }

      if (path.isPremium && path.price > 0) {
        if ((user.timeCredits || 0) < path.price) {
          throw new Error(`Insufficient credits. You need ${path.price} credits to enroll.`);
        }

        user.timeCredits -= path.price;
        await user.save();
      }
      
      // Create enrollment
      enrollment = new PathEnrollment({
        user: userId,
        path: pathId,
        startedAt: new Date()
      });
      
      await enrollment.save();
      
      // Update path stats
      await LearningPath.findByIdAndUpdate(path._id, {
        $inc: { 'stats.enrollments': 1 }
      });
      
      return enrollment;
    } catch (error) {
      console.error('Error enrolling in path:', error);
      throw error;
    }
  }

  // Get user's enrollments
  static async getUserEnrollments(userId, status = null) {
    try {
      const query = { user: userId };
      
      if (status) {
        query.status = status;
      }
      
      const enrollments = await PathEnrollment.find(query)
        .populate('path')
        .sort('-lastAccessedAt');
      
      return enrollments;
    } catch (error) {
      console.error('Error getting enrollments:', error);
      throw error;
    }
  }

  // Get enrollment details
  static async getEnrollment(userId, pathId) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      }).populate('path');
      
      return enrollment;
    } catch (error) {
      console.error('Error getting enrollment:', error);
      throw error;
    }
  }

  // Complete lesson
  static async completeLesson(userId, pathId, moduleIndex, lessonIndex, data = {}) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      // Mark lesson complete
      enrollment.completeLesson(
        moduleIndex,
        lessonIndex,
        data.score,
        data.timeSpent || 0
      );
      
      // Check if module is now complete
      const moduleComplete = await enrollment.isModuleCompleted(moduleIndex);
      if (moduleComplete) {
        enrollment.completeModule(moduleIndex);
      }
      
      // Calculate progress
      await enrollment.calculateProgress();
      
      // Check if path is complete
      const pathComplete = await enrollment.checkCompletion();
      
      await enrollment.save();
      
      // If completed, issue certificate
      if (pathComplete) {
        try {
          await this.issueCertificate(enrollment);
        } catch (certificateError) {
          // Keep completion successful even if certificate generation fails temporarily.
          console.error('Error issuing learning path certificate:', certificateError);
        }
      }
      
      return {
        enrollment,
        lessonCompleted: true,
        moduleCompleted: moduleComplete,
        pathCompleted: pathComplete
      };
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  // Submit quiz
  static async submitQuiz(userId, pathId, moduleIndex, lessonIndex, answers) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      }).populate('path');
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      const lesson = enrollment.path.modules[moduleIndex].lessons[lessonIndex];
      
      if (!lesson || !lesson.quiz || lesson.quiz.length === 0) {
        throw new Error('No quiz found for this lesson');
      }
      
      // Grade quiz
      let correct = 0;
      const results = lesson.quiz.map((question, index) => {
        const isCorrect = answers[index] === question.correctAnswer;
        if (isCorrect) correct++;
        
        return {
          question: question.question,
          userAnswer: answers[index],
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation
        };
      });
      
      const score = Math.round((correct / lesson.quiz.length) * 100);
      
      // Update quiz scores
      const existingScore = enrollment.quizScores.find(
        q => q.moduleIndex === moduleIndex && q.lessonIndex === lessonIndex
      );
      
      if (existingScore) {
        existingScore.score = Math.max(existingScore.score, score);
        existingScore.attempts += 1;
        existingScore.lastAttempt = new Date();
      } else {
        enrollment.quizScores.push({
          moduleIndex,
          lessonIndex,
          score,
          maxScore: 100,
          attempts: 1,
          lastAttempt: new Date()
        });
      }
      
      await enrollment.save();
      
      // If passed, mark lesson complete
      if (score >= 70) {
        await this.completeLesson(userId, pathId, moduleIndex, lessonIndex, { score });
      }
      
      return {
        score,
        passed: score >= 70,
        results
      };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  // Submit project
  static async submitProject(userId, pathId, moduleIndex, lessonIndex, submissionUrl) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      // Add/update project submission
      const existingProject = enrollment.projects.find(
        p => p.moduleIndex === moduleIndex && p.lessonIndex === lessonIndex
      );
      
      if (existingProject) {
        existingProject.submissionUrl = submissionUrl;
        existingProject.submittedAt = new Date();
        existingProject.status = 'pending';
      } else {
        enrollment.projects.push({
          moduleIndex,
          lessonIndex,
          submissionUrl,
          submittedAt: new Date(),
          status: 'pending'
        });
      }
      
      await enrollment.save();
      
      return enrollment;
    } catch (error) {
      console.error('Error submitting project:', error);
      throw error;
    }
  }

  // Add note
  static async addNote(userId, pathId, moduleIndex, lessonIndex, note) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      enrollment.notes.push({
        moduleIndex,
        lessonIndex,
        note
      });
      
      await enrollment.save();
      
      return enrollment;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  // Toggle bookmark
  static async toggleBookmark(userId, pathId, moduleIndex, lessonIndex) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      const existingIndex = enrollment.bookmarks.findIndex(
        b => b.moduleIndex === moduleIndex && b.lessonIndex === lessonIndex
      );
      
      if (existingIndex >= 0) {
        enrollment.bookmarks.splice(existingIndex, 1);
      } else {
        enrollment.bookmarks.push({
          moduleIndex,
          lessonIndex
        });
      }
      
      await enrollment.save();
      
      return enrollment;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  // Submit rating
  static async submitRating(userId, pathId, rating, feedback) {
    try {
      const enrollment = await PathEnrollment.findOne({
        user: userId,
        path: pathId
      });
      
      if (!enrollment) {
        throw new Error('Not enrolled in this path');
      }
      
      enrollment.rating = {
        value: rating,
        feedback,
        submittedAt: new Date()
      };
      
      await enrollment.save();
      
      // Update path rating
      const path = await LearningPath.findById(pathId);
      path.updateRating(rating);
      await path.save();
      
      return enrollment;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  // Issue certificate
  static async issueCertificate(enrollment) {
    try {
      await enrollment.populate('path user');
      
      const path = enrollment.path;
      
      // Check if certificate requirements met
      if (!path.certificate.enabled) {
        return null;
      }

      const requirements = path.certificate.requirements || {};
      const minCompletionRate = Number(requirements.minCompletionRate ?? 100);
      const minQuizScore = Number(requirements.minQuizScore ?? 0);
      const requiredProjects = Number(requirements.requiredProjects ?? 0);

      if ((enrollment.progress.overallProgress || 0) < minCompletionRate) {
        return null;
      }

      const quizScores = (enrollment.quizScores || [])
        .map((entry) => Number(entry.score))
        .filter((value) => !Number.isNaN(value));
      const avgQuizScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((sum, value) => sum + value, 0) / quizScores.length)
        : 0;

      const hasQuizLessons = (path.modules || []).some((module) =>
        (module.lessons || []).some((lesson) => lesson.type === 'quiz')
      );

      if (hasQuizLessons && minQuizScore > 0 && avgQuizScore < minQuizScore) {
        return null;
      }

      const submittedProjects = (enrollment.projects || []).filter((project) =>
        project?.submissionUrl &&
        ['pending', 'reviewed', 'approved'].includes(project.status)
      ).length;

      if (requiredProjects > 0 && submittedProjects < requiredProjects) {
        return null;
      }

      const existingCertificate = await Certificate.findOne({
        certificateType: 'learning_path',
        pathEnrollment: enrollment._id,
        isRevoked: false
      });

      if (existingCertificate) {
        if (!enrollment.certificate?.issued) {
          enrollment.certificate = {
            issued: true,
            certificateId: existingCertificate.certificateId,
            issuedAt: existingCertificate.issuedDate
          };
          await enrollment.save();
        }
        return existingCertificate;
      }
      
      // Create certificate
      const certificate = await Certificate.create({
        certificateType: 'learning_path',
        user: enrollment.user._id,
        learningPath: path._id,
        pathEnrollment: enrollment._id,
        title: path.certificate.title || `${path.title} Completion Certificate`,
        description: path.certificate.description || `Completed the learning path: ${path.title}`,
        verificationMethod: 'learning_path',
        score: avgQuizScore || undefined,
        issuedDate: new Date(),
        badge: 'bronze'
      });

      certificate.badge = certificate.determineBadge();
      await certificate.save();
      
      // Update enrollment
      enrollment.certificate = {
        issued: true,
        certificateId: certificate.certificateId,
        issuedAt: new Date()
      };
      
      await enrollment.save();
      
      return certificate;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  // Get recommended paths
  static async getRecommendedPaths(userId, limit = 6) {
    try {
      await this.ensurePublishedPathsSeeded();

      const [user, enrollments, userSkills] = await Promise.all([
        User.findById(userId).select('interests skills teachingSkills learningSkills'),
        PathEnrollment.find({ user: userId }).populate('path'),
        Skill.find({ provider: userId, isActive: true }).select('category tags title')
      ]);

      const enrolledPathIds = enrollments
        .map((item) => item.path?._id)
        .filter(Boolean);

      const enrolledCategories = enrollments
        .map((item) => item.path?.category)
        .filter(Boolean);

      const interestTokens = new Set([
        ...(user?.interests || []),
        ...((user?.skills || []).map((skill) => skill.name).filter(Boolean)),
        ...((user?.teachingSkills || []).map((skill) => skill.name).filter(Boolean)),
        ...((user?.learningSkills || []).map((skill) => skill.name).filter(Boolean)),
        ...(userSkills.map((skill) => skill.category).filter(Boolean)),
        ...(userSkills.flatMap((skill) => skill.tags || []))
      ].map((token) => token.toString().toLowerCase()));

      const candidates = await LearningPath.find({
        status: 'published',
        _id: { $nin: enrolledPathIds }
      }).populate('creator', 'firstName lastName avatar');

      const scored = candidates.map((path) => {
        const category = (path.category || '').toLowerCase();
        const tags = (path.tags || []).map((tag) => tag.toLowerCase());
        const title = (path.title || '').toLowerCase();

        let score = 0;

        if (enrolledCategories.includes(path.category)) {
          score += 40;
        }

        if (interestTokens.has(category)) {
          score += 30;
        }

        if (tags.some((tag) => interestTokens.has(tag))) {
          score += 20;
        }

        if ([...interestTokens].some((token) => token && title.includes(token))) {
          score += 15;
        }

        score += Math.min(path.stats?.averageRating || 0, 5) * 5;
        score += Math.min((path.stats?.enrollments || 0) / 10, 20);
        if (path.isFeatured) score += 10;

        return { path, score };
      });

      const forYou = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.path);

      const sameCategory = scored
        .filter((item) => enrolledCategories.includes(item.path.category))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.path);

      const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
      const targetByCategory = new Map();

      enrollments.forEach((item) => {
        const category = item.path?.category;
        const level = item.path?.level;
        if (!category || !levelOrder.includes(level)) return;

        const currentIndex = levelOrder.indexOf(level);
        const savedIndex = targetByCategory.get(category);
        if (savedIndex === undefined || currentIndex > savedIndex) {
          targetByCategory.set(category, currentIndex);
        }
      });

      const nextLevelQueries = Array.from(targetByCategory.entries())
        .map(([category, idx]) => ({
          category,
          level: levelOrder[Math.min(idx + 1, levelOrder.length - 1)]
        }));

      const nextLevelBuckets = await Promise.all(
        nextLevelQueries.map((item) =>
          LearningPath.find({
            status: 'published',
            category: item.category,
            level: item.level,
            _id: { $nin: enrolledPathIds }
          })
            .sort('-stats.averageRating -stats.enrollments')
            .limit(Math.max(1, Math.ceil(limit / 2)))
            .populate('creator', 'firstName lastName avatar')
        )
      );

      const nextLevel = nextLevelBuckets.flat().slice(0, limit);

      const popular = [...candidates]
        .sort((a, b) => {
          const aScore = (a.stats?.enrollments || 0) * 2 + (a.stats?.averageRating || 0) * 10;
          const bScore = (b.stats?.enrollments || 0) * 2 + (b.stats?.averageRating || 0) * 10;
          return bScore - aScore;
        })
        .slice(0, limit);

      const trending = [...candidates]
        .sort((a, b) => {
          const aScore = (a.stats?.enrollments || 0) + (a.isFeatured ? 25 : 0) + (a.stats?.averageRating || 0) * 5;
          const bScore = (b.stats?.enrollments || 0) + (b.isFeatured ? 25 : 0) + (b.stats?.averageRating || 0) * 5;
          if (bScore !== aScore) return bScore - aScore;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, limit);

      return {
        forYou,
        sameCategory,
        nextLevel,
        popular,
        trending
      };
    } catch (error) {
      console.error('Error getting recommended paths:', error);
      throw error;
    }
  }

  // Get path statistics
  static async getPathStats(pathId) {
    try {
      const [path, enrollments] = await Promise.all([
        LearningPath.findById(pathId),
        PathEnrollment.find({ path: pathId })
      ]);
      
      const completions = enrollments.filter(e => e.status === 'completed').length;
      const active = enrollments.filter(e => e.status === 'active').length;
      
      const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress.overallProgress, 0) / enrollments.length
        : 0;
      
      return {
        totalEnrollments: enrollments.length,
        activeEnrollments: active,
        completions,
        completionRate: enrollments.length > 0 ? (completions / enrollments.length) * 100 : 0,
        averageProgress: Math.round(avgProgress),
        averageRating: path.stats.averageRating,
        totalRatings: path.stats.totalRatings
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = LearningPathService;
