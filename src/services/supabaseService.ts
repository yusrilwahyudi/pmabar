import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, ClassItem, ClassMember, LearningItem, Submission, StudentProgress } from '../types/lms';

export const supabaseService = {
  // Fetch All Initial Data
  async loadAllData() {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const [
        usersRes,
        classesRes,
        membersRes,
        itemsRes,
        submissionsRes,
        progressRes
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('class_members').select('*'),
        supabase.from('learning_items').select('*').order('order_num', { ascending: true }),
        supabase.from('submissions').select('*'),
        supabase.from('student_progress').select('*')
      ]);

      const users: User[] = (usersRes.data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        idNumber: u.id_number,
        password: u.password,
        isPasswordChanged: u.is_password_changed
      }));

      const classes: ClassItem[] = (classesRes.data || []).map(c => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        code: c.code,
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        teacherAvatar: c.teacher_avatar,
        theme: c.theme,
        description: c.description,
        totalModules: c.total_modules,
        sequentialLocking: c.sequential_locking,
        createdAt: c.created_at
      }));

      const classMembers: ClassMember[] = (membersRes.data || []).map(m => ({
        id: m.id,
        classId: m.class_id,
        studentId: m.student_id,
        studentName: m.student_name,
        studentNisn: m.student_nisn,
        joinedAt: m.joined_at
      }));

      const learningItems: LearningItem[] = (itemsRes.data || []).map(i => ({
        id: i.id,
        classId: i.class_id,
        chapterTitle: i.chapter_title,
        meetingSession: i.meeting_session,
        isSessionLocked: i.is_session_locked,
        releaseDateLabel: i.release_date_label,
        title: i.title,
        description: i.description,
        type: i.type,
        order: i.order_num,
        tag: i.tag,
        durationLabel: i.duration_label,
        contentMarkdown: i.content_markdown,
        documentFile: i.document_file,
        youtubeVideoId: i.youtube_video_id,
        assessmentFormat: i.assessment_format,
        durationMinutes: i.duration_minutes,
        deadline: i.deadline,
        enableAntiCheat: i.enable_anti_cheat,
        questions: i.questions,
        maxScore: i.max_score,
        showInstantResult: i.show_instant_result,
        allowedFormats: i.allowed_formats
      }));

      const submissions: Submission[] = (submissionsRes.data || []).map(s => ({
        id: s.id,
        learningItemId: s.learning_item_id,
        classId: s.class_id,
        studentId: s.student_id,
        studentName: s.student_name,
        studentAvatar: s.student_avatar,
        submissionType: s.submission_type,
        fileName: s.file_name,
        fileSize: s.file_size,
        fileUrl: s.file_url,
        notes: s.notes,
        answers: s.answers,
        isLate: s.is_late,
        submittedAt: s.submitted_at,
        score: s.score,
        maxScore: s.max_score,
        teacherFeedback: s.teacher_feedback,
        gradedAt: s.graded_at
      }));

      const studentProgressList: StudentProgress[] = (progressRes.data || []).map(p => ({
        classId: p.class_id,
        studentId: p.student_id,
        completedItemIds: p.completed_item_ids || [],
        lastAccessedItemId: p.last_accessed_item_id,
        updatedAt: p.updated_at
      }));

      return {
        users,
        classes,
        classMembers,
        learningItems,
        submissions,
        studentProgressList
      };
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
      return null;
    }
  },

  // Sync Single User
  async saveUser(user: User) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('users').upsert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        id_number: user.idNumber,
        password: user.password,
        is_password_changed: user.isPasswordChanged
      });
    } catch (err) {
      console.error('Error saving user to Supabase:', err);
    }
  },

  async deleteUser(userId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('users').delete().eq('id', userId);
    } catch (err) {
      console.error('Error deleting user from Supabase:', err);
    }
  },

  // Sync Class
  async saveClass(classItem: ClassItem) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('classes').upsert({
        id: classItem.id,
        title: classItem.title,
        subject: classItem.subject,
        code: classItem.code,
        teacher_id: classItem.teacherId,
        teacher_name: classItem.teacherName,
        teacher_avatar: classItem.teacherAvatar,
        theme: classItem.theme,
        description: classItem.description,
        total_modules: classItem.totalModules,
        sequential_locking: classItem.sequentialLocking
      });
    } catch (err) {
      console.error('Error saving class to Supabase:', err);
    }
  },

  async deleteClass(classId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('classes').delete().eq('id', classId);
    } catch (err) {
      console.error('Error deleting class from Supabase:', err);
    }
  },

  // Sync Member
  async saveClassMember(member: ClassMember) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('class_members').upsert({
        id: member.id,
        class_id: member.classId,
        student_id: member.studentId,
        student_name: member.studentName,
        student_nisn: member.studentNisn,
        joined_at: member.joinedAt
      });
    } catch (err) {
      console.error('Error saving class member to Supabase:', err);
    }
  },

  async deleteClassMember(classId: string, studentId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId);
    } catch (err) {
      console.error('Error deleting class member from Supabase:', err);
    }
  },

  // Sync Learning Item
  async saveLearningItem(item: LearningItem) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('learning_items').upsert({
        id: item.id,
        class_id: item.classId,
        chapter_title: item.chapterTitle,
        meeting_session: item.meetingSession,
        is_session_locked: item.isSessionLocked,
        release_date_label: item.releaseDateLabel,
        title: item.title,
        description: item.description,
        type: item.type,
        order_num: item.order,
        tag: item.tag,
        duration_label: item.durationLabel,
        content_markdown: item.contentMarkdown,
        document_file: item.documentFile,
        youtube_video_id: item.youtubeVideoId,
        assessment_format: item.assessmentFormat,
        duration_minutes: item.durationMinutes,
        deadline: item.deadline,
        enable_anti_cheat: item.enableAntiCheat,
        questions: item.questions,
        max_score: item.maxScore,
        show_instant_result: item.showInstantResult,
        allowed_formats: item.allowedFormats
      });
    } catch (err) {
      console.error('Error saving learning item to Supabase:', err);
    }
  },

  async deleteLearningItem(itemId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('learning_items').delete().eq('id', itemId);
    } catch (err) {
      console.error('Error deleting learning item from Supabase:', err);
    }
  },

  // Sync Submission
  async saveSubmission(submission: Submission) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('submissions').upsert({
        id: submission.id,
        learning_item_id: submission.learningItemId,
        class_id: submission.classId,
        student_id: submission.studentId,
        student_name: submission.studentName,
        student_avatar: submission.studentAvatar,
        submission_type: submission.submissionType,
        file_name: submission.fileName,
        file_size: submission.fileSize,
        file_url: submission.fileUrl,
        notes: submission.notes,
        answers: submission.answers,
        is_late: submission.isLate,
        submitted_at: submission.submittedAt,
        score: submission.score,
        max_score: submission.maxScore,
        teacher_feedback: submission.teacherFeedback,
        graded_at: submission.gradedAt
      });
    } catch (err) {
      console.error('Error saving submission to Supabase:', err);
    }
  },

  // Sync Student Progress
  async saveStudentProgress(progress: StudentProgress) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('student_progress').upsert({
        id: `prog-${progress.classId}-${progress.studentId}`,
        class_id: progress.classId,
        student_id: progress.studentId,
        completed_item_ids: progress.completedItemIds,
        last_accessed_item_id: progress.lastAccessedItemId,
        updated_at: progress.updatedAt
      });
    } catch (err) {
      console.error('Error saving progress to Supabase:', err);
    }
  },

  // Upload File to Supabase Storage Bucket
  async uploadFile(file: File, folder = 'documents'): Promise<{ name: string; size: string; url: string } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lms-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('lms-files')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: publicUrlData.publicUrl
      };
    } catch (err) {
      console.error('File upload exception:', err);
      return null;
    }
  }
};
