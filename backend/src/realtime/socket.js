const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ExamSession = require('../models/ExamSession');
const Assessment = require('../models/Assessment');

let io;

/**
 * Room naming convention:
 *  - `exam:<assessmentId>` — every student + lecturer watching this assessment
 * Students join to send their own violation events; lecturers join read-only
 * to receive live broadcasts (student-joined, student-violation, student-left).
 */

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new Error('User not found or inactive.'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed.'));
    }
  });

  io.on('connection', (socket) => {
    const room = (assessmentId) => `exam:${assessmentId}`;

    // Student starts/resumes a live exam session.
    socket.on('join-exam', async ({ assessmentId, examSessionId }, callback) => {
      try {
        if (socket.user.role !== 'student') {
          return callback?.({ error: 'Only students can join an exam session.' });
        }

        const session = await ExamSession.findById(examSessionId);
        if (!session || String(session.student) !== String(socket.user._id)) {
          return callback?.({ error: 'Exam session not found.' });
        }

        socket.join(room(assessmentId));
        socket.examSessionId = examSessionId;
        socket.assessmentId = assessmentId;

        socket.to(room(assessmentId)).emit('student-joined', {
          examSessionId,
          studentId: socket.user._id,
          studentName: `${socket.user.firstName} ${socket.user.lastName}`,
          integrityScore: session.integrityScore,
        });

        callback?.({ ok: true, integrityScore: session.integrityScore });
      } catch (err) {
        callback?.({ error: 'Failed to join exam session.' });
      }
    });

    // Lecturer opens the live monitoring dashboard for an assessment.
    socket.on('watch-exam', async ({ assessmentId }, callback) => {
      try {
        if (socket.user.role !== 'lecturer') {
          return callback?.({ error: 'Only lecturers can watch an exam session.' });
        }
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment || String(assessment.createdBy) !== String(socket.user._id)) {
          return callback?.({ error: 'Not authorized to watch this assessment.' });
        }
        socket.join(room(assessmentId));
        callback?.({ ok: true });
      } catch (err) {
        callback?.({ error: 'Failed to watch exam session.' });
      }
    });

    // Student reports a violation event (no video/images, just a type label).
    socket.on('violation', async ({ type }, callback) => {
      try {
        if (!socket.examSessionId) {
          return callback?.({ error: 'Not in an active exam session.' });
        }
        const session = await ExamSession.findById(socket.examSessionId);
        if (!session || session.status !== 'in_progress') {
          return callback?.({ error: 'Exam session is not active.' });
        }

        const { violation, isNewWarning, integrityScore } = session.recordViolation(type);
        await session.save();

        const payload = {
          examSessionId: session._id,
          studentId: socket.user._id,
          studentName: `${socket.user.firstName} ${socket.user.lastName}`,
          type,
          isNewWarning,
          integrityScore,
          timestamp: violation.timestamp,
        };

        // Student gets it back immediately (for the warning modal / 15% alert).
        socket.emit('violation-recorded', payload);
        // Lecturer(s) watching this assessment get it live too.
        socket.to(room(socket.assessmentId)).emit('student-violation', payload);

        callback?.({ ok: true, integrityScore, isNewWarning });
      } catch (err) {
        callback?.({ error: 'Failed to record violation.' });
      }
    });

    socket.on('disconnect', () => {
      if (socket.examSessionId && socket.assessmentId) {
        socket.to(room(socket.assessmentId)).emit('student-left', {
          examSessionId: socket.examSessionId,
          studentId: socket.user._id,
        });
      }
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io has not been initialized yet.');
  return io;
}

module.exports = { initSocket, getIo };
