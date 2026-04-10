const VideoCall = require('../models/VideoCall');
const Booking = require('../models/Booking');
const crypto = require('crypto');

class VideoCallService {
  
  // Generate unique room ID
  static generateRoomId() {
    return `room_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  static parseTimeTo24Hour(timeValue) {
    if (!timeValue || typeof timeValue !== 'string') {
      throw new Error('Invalid time format');
    }

    const normalized = timeValue.trim().toUpperCase();

    // Supports HH:mm
    const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourHour) {
      const hours = parseInt(twentyFourHour[1], 10);
      const minutes = parseInt(twentyFourHour[2], 10);

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return { hours, minutes };
      }
    }

    // Supports h:mm AM/PM
    const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (twelveHour) {
      let hours = parseInt(twelveHour[1], 10);
      const minutes = parseInt(twelveHour[2], 10);
      const meridiem = twelveHour[3];

      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time value');
      }

      if (meridiem === 'AM') {
        hours = hours === 12 ? 0 : hours;
      } else {
        hours = hours === 12 ? 12 : hours + 12;
      }

      return { hours, minutes };
    }

    throw new Error('Unsupported time format');
  }

  static combineDateAndTime(dateValue, timeValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid booking date');
    }

    const { hours, minutes } = this.parseTimeTo24Hour(timeValue);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  // Create video call from booking
  static async createCallFromBooking(bookingId, hostUserId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('student provider');

      if (!booking) {
        throw new Error('Booking not found');
      }

      const hostId = hostUserId?.toString();
      const studentId = booking.student?._id?.toString();
      const providerId = booking.provider?._id?.toString();

      const isParticipant = hostId === studentId || hostId === providerId;
      if (!isParticipant) {
        throw new Error('Not authorized for this booking call');
      }

      if (booking.status !== 'confirmed' && booking.status !== 'completed') {
        throw new Error('Video call is available after booking confirmation');
      }

      // Check if call already exists
      let call = await VideoCall.findOne({ booking: bookingId });
      
      if (call) {
        return call;
      }

      const scheduledStart = this.combineDateAndTime(booking.scheduledDate, booking.startTime);
      const scheduledEnd = this.combineDateAndTime(
        booking.scheduledDate,
        booking.endTime || booking.startTime
      );

      // Determine participants
      const participants = [
        { user: booking.provider._id, role: 'host' },
        { user: booking.student._id, role: 'participant' }
      ];

      // Create video call
      call = await VideoCall.create({
        booking: bookingId,
        roomId: this.generateRoomId(),
        participants,
        scheduledStart,
        scheduledEnd,
        status: 'scheduled',
        callType: 'one-on-one'
      });

      return call;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  // Get call by room ID
  static async getCallByRoomId(roomId) {
    try {
      const call = await VideoCall.findOne({ roomId })
        .populate('booking')
        .populate('participants.user', 'firstName lastName avatar');

      return call;
    } catch (error) {
      console.error('Error getting call:', error);
      throw error;
    }
  }

  // Join call
  static async joinCall(roomId, userId, role = 'participant') {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      if (call.status === 'ended' || call.status === 'cancelled') {
        throw new Error('Call has ended');
      }

      // Update status to waiting if scheduled
      if (call.status === 'scheduled') {
        call.status = 'waiting';
      }

      // Add user to participants
      call.userJoins(userId, role);
      await call.save();

      return call;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  }

  // Leave call
  static async leaveCall(roomId, userId) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      call.userLeaves(userId);
      await call.save();

      return call;
    } catch (error) {
      console.error('Error leaving call:', error);
      throw error;
    }
  }

  // Add chat message
  static async addChatMessage(roomId, userId, message) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      call.addChatMessage(userId, message);
      await call.save();

      return call.chatMessages[call.chatMessages.length - 1];
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  // Start recording
  static async startRecording(roomId) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      call.recording.isRecorded = true;
      call.recording.recordingStarted = new Date();
      call.featuresUsed.recording = true;
      
      await call.save();

      return call;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording
  static async stopRecording(roomId, recordingUrl, size) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      call.recording.recordingStopped = new Date();
      call.recording.recordingUrl = recordingUrl;
      call.recording.recordingSize = size;
      
      if (call.recording.recordingStarted) {
        call.recording.recordingDuration = Math.floor(
          (call.recording.recordingStopped - call.recording.recordingStarted) / 1000
        );
      }
      
      await call.save();

      return call;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  // Report issue
  static async reportIssue(roomId, userId, issueType) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      call.reportIssue(userId, issueType);
      await call.save();

      return call;
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  }

  // Toggle feature
  static async toggleFeature(roomId, feature, enabled) {
    try {
      const call = await this.getCallByRoomId(roomId);

      if (!call) {
        throw new Error('Call not found');
      }

      if (call.featuresUsed.hasOwnProperty(feature)) {
        call.featuresUsed[feature] = enabled;
        await call.save();
      }

      return call;
    } catch (error) {
      console.error('Error toggling feature:', error);
      throw error;
    }
  }

  // Submit feedback
  static async submitFeedback(roomId, userId, rating, comment) {
    try {
      const call = await VideoCall.findOne({ roomId });

      if (!call) {
        throw new Error('Call not found');
      }

      // Check if already submitted
      const existingFeedback = call.feedback.find(
        f => f.user.toString() === userId.toString()
      );

      if (existingFeedback) {
        existingFeedback.rating = rating;
        existingFeedback.comment = comment;
        existingFeedback.submittedAt = new Date();
      } else {
        call.feedback.push({
          user: userId,
          rating,
          comment,
          submittedAt: new Date()
        });
      }

      await call.save();

      return call;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Get user's call history
  static async getCallHistory(userId, limit = 20, skip = 0) {
    try {
      const calls = await VideoCall.find({
        'participants.user': userId,
        status: 'ended'
      })
        .populate('booking')
        .populate('participants.user', 'firstName lastName avatar')
        .sort('-actualStart')
        .limit(limit)
        .skip(skip);

      return calls;
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  }

  // Get upcoming calls
  static async getUpcomingCalls(userId) {
    try {
      const now = new Date();
      const calls = await VideoCall.find({
        'participants.user': userId,
        status: { $in: ['scheduled', 'waiting'] },
        scheduledStart: { $gte: now }
      })
        .populate('booking')
        .populate('participants.user', 'firstName lastName avatar')
        .sort('scheduledStart')
        .limit(10);

      return calls;
    } catch (error) {
      console.error('Error getting upcoming calls:', error);
      throw error;
    }
  }

  // Get call stats
  static async getCallStats(userId) {
    try {
      const [totalCalls, totalDuration, avgRating] = await Promise.all([
        VideoCall.countDocuments({
          'participants.user': userId,
          status: 'ended'
        }),
        
        VideoCall.aggregate([
          { 
            $match: { 
              'participants.user': userId,
              status: 'ended',
              duration: { $exists: true }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$duration' }
            }
          }
        ]),
        
        VideoCall.aggregate([
          {
            $match: {
              'participants.user': userId,
              'feedback.user': userId
            }
          },
          { $unwind: '$feedback' },
          {
            $match: {
              'feedback.user': userId
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$feedback.rating' }
            }
          }
        ])
      ]);

      return {
        totalCalls,
        totalDuration: totalDuration[0]?.total || 0,
        averageRating: avgRating[0]?.avgRating || 0
      };
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }
}

module.exports = VideoCallService;
