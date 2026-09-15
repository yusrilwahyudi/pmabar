import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  ClassItem,
  ClassMember,
  LearningItem,
  Submission,
  StudentProgress
} from '../types/lms';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_CLASS_MEMBERS,
  INITIAL_LEARNING_ITEMS,
  INITIAL_SUBMISSIONS,
  INITIAL_STUDENT_PROGRESS
} from '../services/mockData';
import { supabaseService } from '../services/supabaseService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface LMSContextType {
  currentUser: User | null;
  users: User[];
  classes: ClassItem[];
  classMembers: ClassMember[];
  learningItems: LearningItem[];
  submissions: Submission[];
  studentProgressList: StudentProgress[];

  // Cloud status
  isCloudConnected: boolean;

  // Authentication
  loginStudent: (nisn: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  loginTeacher: (identifier: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  changePassword: (userId: string, oldPass: string, newPass: string) => { success: boolean; message: string };

  // Student Account Management (Guru)
  registerStudent: (student: { idNumber: string; name: string; email?: string }) => { success: boolean; message: string };
  deleteStudent: (studentId: string) => void;
  resetStudentPassword: (studentId: string) => void;

  // Class Management
  createClass: (classData: Omit<ClassItem, 'id' | 'createdAt' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'totalModules'>) => ClassItem;
  duplicateClass: (sourceClassId: string, newTitle: string) => ClassItem | null;
  deleteClass: (classId: string) => void;
  joinClassByCode: (code: string) => { success: boolean; message: string; classItem?: ClassItem };
  leaveClass: (classId: string, studentId?: string) => void;

  // Sequential Progress & Locking
  markItemAsCompleted: (classId: string, itemId: string) => void;
  getStudentClassProgress: (classId: string, studentId?: string) => {
    completedItemIds: string[];
    totalCount: number;
    completedCount: number;
    percentage: number;
    isItemCompleted: (itemId: string) => boolean;
    isItemUnlocked: (itemId: string) => boolean;
  };

  // Unified Learning Items
  createLearningItem: (itemData: Omit<LearningItem, 'id'>) => LearningItem;
  updateLearningItem: (itemId: string, itemData: Partial<LearningItem>) => void;
  deleteLearningItem: (itemId: string) => void;
  reorderLearningItems: (classId: string, itemIdsInOrder: string[]) => void;
  toggleSessionLock: (classId: string, chapterTitle: string, meetingSession: string, isLocked: boolean) => void;
  copyLearningItemToClass: (itemId: string, targetClassIds: string[]) => void;
  copySessionToClass: (sourceClassId: string, chapterTitle: string, meetingSession: string, targetClassIds: string[]) => void;

  // Unified Submissions & Grading
  submitAssessment: (submissionData: Omit<Submission, 'id' | 'submittedAt'>) => Submission;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => void;

  // Reset
  resetData: () => void;
}

const LMSContext = createContext<LMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'daring_lms_users',
  SESSION_USER: 'daring_lms_session',
  CLASSES: 'daring_lms_classes',
  MEMBERS: 'daring_lms_members',
  LEARNING_ITEMS: 'daring_lms_items',
  SUBMISSIONS: 'daring_lms_submissions',
  PROGRESS: 'daring_lms_progress'
};

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [classMembers, setClassMembers] = useState<ClassMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? JSON.parse(saved) : INITIAL_CLASS_MEMBERS;
  });

  const [learningItems, setLearningItems] = useState<LearningItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEARNING_ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_LEARNING_ITEMS;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [studentProgressList, setStudentProgressList] = useState<StudentProgress[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_PROGRESS;
  });

  // Fetch live data from Supabase Cloud on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabaseService.loadAllData().then(data => {
        if (data) {
          if (data.users.length > 0) setUsers(data.users);
          setClasses(data.classes);
          setClassMembers(data.classMembers);
          setLearningItems(data.learningItems);
          setSubmissions(data.submissions);
          setStudentProgressList(data.studentProgressList);
        }
      });
    }
  }, []);

  // LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(classMembers));
  }, [classMembers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEARNING_ITEMS, JSON.stringify(learningItems));
  }, [learningItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(studentProgressList));
  }, [studentProgressList]);

  // Auth Handlers
  const loginStudent = async (nisn: string, pass: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanNisn = nisn.trim();
    const cleanPass = pass.trim();

    // 1. Check local state first
    let student = users.find(u => u.role === 'siswa' && u.idNumber && u.idNumber.trim() === cleanNisn);

    // 2. If not found, live fetch directly from Supabase
    if (!student && isSupabaseConfigured && supabase) {
      try {
        const { data } = await (supabase as any)
          .from('users')
          .select('*')
          .eq('id_number', cleanNisn)
          .maybeSingle();

        if (data) {
          student = {
            id: data.id,
            name: data.name || 'Siswa',
            email: data.email || `${data.id_number}@siswa.smkn5gowa.sch.id`,
            role: (data.role || 'siswa') as UserRole,
            avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.id_number}`,
            idNumber: data.id_number,
            password: data.password,
            isPasswordChanged: Boolean(data.is_password_changed)
          };
          setUsers(prev => [...prev.filter(u => u.id !== student!.id), student!]);
        }
      } catch (err) {
        console.error('Error fetching student from Supabase:', err);
      }
    }

    if (!student) {
      return { success: false, message: 'Nomor NISN tidak terdaftar dalam sistem.' };
    }

    const expectedPass = (student.password || student.idNumber || '').trim();
    if (cleanPass !== expectedPass) {
      return { success: false, message: 'Kata sandi salah. Silakan coba lagi.' };
    }

    setCurrentUser(student);
    return { success: true, message: 'Login berhasil', user: student };
  };

  const loginTeacher = async (identifier: string, pass: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Check local state first
    let teacher = users.find(
      u => u.role === 'guru' && (((u.email || '').toLowerCase() === cleanId) || (u.idNumber && u.idNumber.trim() === identifier.trim()))
    );

    // 2. If not found, live fetch directly from Supabase
    if (!teacher && isSupabaseConfigured && supabase) {
      try {
        const { data } = await (supabase as any)
          .from('users')
          .select('*')
          .or(`id_number.eq.${identifier.trim()},email.ilike.${identifier.trim()}`)
          .maybeSingle();

        if (data) {
          teacher = {
            id: data.id,
            name: data.name || 'Guru',
            email: data.email || `${data.id_number}@guru.smkn5gowa.sch.id`,
            role: (data.role || 'guru') as UserRole,
            avatar: data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            idNumber: data.id_number,
            password: data.password,
            isPasswordChanged: Boolean(data.is_password_changed)
          };
          setUsers(prev => [...prev.filter(u => u.id !== teacher!.id), teacher!]);
        }
      } catch (err) {
        console.error('Error fetching teacher from Supabase:', err);
      }
    }

    if (!teacher) {
      return { success: false, message: 'Akun guru/pengajar tidak ditemukan.' };
    }

    const expectedPass = (teacher.password || 'guru123password').trim();
    if (cleanPass !== expectedPass) {
      return { success: false, message: 'Kata sandi pengajar salah.' };
    }

    setCurrentUser(teacher);
    return { success: true, message: 'Login berhasil', user: teacher };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const changePassword = (userId: string, oldPass: string, newPass: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' };

    const currentPass = user.password || user.idNumber;
    if (oldPass !== currentPass) {
      return { success: false, message: 'Kata sandi saat ini tidak sesuai.' };
    }

    const updatedUser = { ...user, password: newPass, isPasswordChanged: true };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    setCurrentUser(updatedUser);
    supabaseService.saveUser(updatedUser);
    return { success: true, message: 'Kata sandi berhasil diubah.' };
  };

  // Student Account Management
  const registerStudent = (studentData: { idNumber: string; name: string; email?: string }) => {
    const exists = users.some(u => u.idNumber === studentData.idNumber);
    if (exists) {
      return { success: false, message: `NISN ${studentData.idNumber} sudah terdaftar.` };
    }

    const newStudent: User = {
      id: `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: studentData.name,
      idNumber: studentData.idNumber,
      email: studentData.email || `${studentData.idNumber}@siswa.smkn5gowa.sch.id`,
      role: 'siswa',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${studentData.idNumber}`,
      password: studentData.idNumber,
      isPasswordChanged: false
    };

    setUsers(prev => [...prev, newStudent]);
    supabaseService.saveUser(newStudent);
    return { success: true, message: 'Siswa berhasil didaftarkan.' };
  };

  const deleteStudent = (studentId: string) => {
    setUsers(prev => prev.filter(u => u.id !== studentId));
    supabaseService.deleteUser(studentId);
  };

  const resetStudentPassword = (studentId: string) => {
    const updatedUser = users.find(u => u.id === studentId);
    if (updatedUser) {
      const resetUser = { ...updatedUser, password: updatedUser.idNumber, isPasswordChanged: false };
      setUsers(prev =>
        prev.map(u => (u.id === studentId ? resetUser : u))
      );
      supabaseService.saveUser(resetUser);
    }
  };

  // Class Management
  const createClass = (classData: Omit<ClassItem, 'id' | 'createdAt' | 'teacherId' | 'teacherName' | 'teacherAvatar' | 'totalModules'>): ClassItem => {
    const teacher = currentUser || users[0];
    const newClass: ClassItem = {
      ...classData,
      id: `class-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      totalModules: 0,
      createdAt: new Date().toISOString()
    };
    setClasses(prev => [newClass, ...prev]);
    supabaseService.saveClass(newClass);
    return newClass;
  };

  const duplicateClass = (sourceClassId: string, newTitle: string): ClassItem | null => {
    const source = classes.find(c => c.id === sourceClassId);
    if (!source) return null;

    const teacher = currentUser || users[0];
    const newClassId = `class-${Date.now()}`;
    const randomCode = `5G-${Math.floor(1000 + Math.random() * 9000)}`;
    const sourceItems = learningItems.filter(i => i.classId === sourceClassId);

    const newClass: ClassItem = {
      ...source,
      id: newClassId,
      title: newTitle,
      code: randomCode,
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      totalModules: sourceItems.length,
      createdAt: new Date().toISOString()
    };

    const clonedItems: LearningItem[] = sourceItems.map(item => ({
      ...item,
      id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      classId: newClassId
    }));

    setClasses(prev => [newClass, ...prev]);
    setLearningItems(prev => [...prev, ...clonedItems]);

    supabaseService.saveClass(newClass);
    clonedItems.forEach(i => supabaseService.saveLearningItem(i));

    return newClass;
  };

  const deleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    setClassMembers(prev => prev.filter(m => m.classId !== classId));
    setLearningItems(prev => prev.filter(i => i.classId !== classId));
    setSubmissions(prev => prev.filter(s => s.classId !== classId));
    setStudentProgressList(prev => prev.filter(p => p.classId !== classId));
    supabaseService.deleteClass(classId);
  };

  const joinClassByCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const foundClass = classes.find(c => c.code.toUpperCase() === trimmed);
    if (!foundClass) {
      return { success: false, message: 'Kode kelas tidak ditemukan. Mohon periksa kembali kodenya.' };
    }

    if (currentUser) {
      const isAlreadyMember = classMembers.some(
        m => m.classId === foundClass.id && m.studentId === currentUser.id
      );
      if (!isAlreadyMember) {
        const newMember: ClassMember = {
          id: `mem-${Date.now()}`,
          classId: foundClass.id,
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentAvatar: currentUser.avatar,
          studentNisn: currentUser.idNumber,
          joinedAt: new Date().toISOString()
        };
        setClassMembers(prev => [...prev, newMember]);
        supabaseService.saveClassMember(newMember);
      }
    }

    return { success: true, message: `Berhasil bergabung ke kelas ${foundClass.title}`, classItem: foundClass };
  };

  const leaveClass = (classId: string, studentId = currentUser?.id) => {
    if (!studentId) return;
    setClassMembers(prev => prev.filter(m => !(m.classId === classId && m.studentId === studentId)));
    setStudentProgressList(prev => prev.filter(p => !(p.classId === classId && p.studentId === studentId)));
    supabaseService.deleteClassMember(classId, studentId);
  };

  // Sequential Learning Path
  const getStudentClassProgress = (classId: string, studentId = currentUser?.id || '') => {
    const rawClassItems = learningItems
      .filter(item => item.classId === classId)
      .sort((a, b) => a.order - b.order);

    // Group & order hierarchically by Bab -> Pertemuan -> Order
    const classItems: LearningItem[] = [];
    const chapters = Array.from(new Set(rawClassItems.map(i => i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma')));
    chapters.forEach(ch => {
      const chItems = rawClassItems.filter(i => (i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma') === ch);
      const sessions = Array.from(new Set(chItems.map(i => i.meetingSession || 'Pertemuan 1: Fondasi Logika')));
      sessions.forEach(sess => {
        const sessItems = chItems
          .filter(i => (i.meetingSession || 'Pertemuan 1: Fondasi Logika') === sess)
          .sort((a, b) => a.order - b.order);
        classItems.push(...sessItems);
      });
    });

    const classObj = classes.find(c => c.id === classId);
    const isSequential = classObj ? classObj.sequentialLocking : true;

    const progressRecord = studentProgressList.find(
      p => p.classId === classId && p.studentId === studentId
    );
    const completedItemIds = progressRecord ? progressRecord.completedItemIds : [];

    const totalCount = classItems.length;
    const completedCount = classItems.filter(item => completedItemIds.includes(item.id)).length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const isItemCompleted = (itemId: string) => completedItemIds.includes(itemId);

    const isItemUnlocked = (itemId: string) => {
      if (currentUser?.role === 'guru') return true;

      const targetItem = classItems.find(i => i.id === itemId);
      if (targetItem?.isSessionLocked) return false;

      if (!isSequential) return true;

      const itemIndex = classItems.findIndex(i => i.id === itemId);
      if (itemIndex <= 0) return true;

      const previousItem = classItems[itemIndex - 1];
      return completedItemIds.includes(previousItem.id);
    };

    return {
      completedItemIds,
      totalCount,
      completedCount,
      percentage,
      isItemCompleted,
      isItemUnlocked
    };
  };

  const markItemAsCompleted = (classId: string, itemId: string) => {
    if (!currentUser || currentUser.role === 'guru') return;

    setStudentProgressList(prev => {
      const existing = prev.find(
        p => p.classId === classId && p.studentId === currentUser.id
      );

      let updatedProgress: StudentProgress;

      if (existing) {
        if (existing.completedItemIds.includes(itemId)) return prev;
        updatedProgress = {
          ...existing,
          completedItemIds: [...existing.completedItemIds, itemId],
          lastAccessedItemId: itemId,
          updatedAt: new Date().toISOString()
        };
        supabaseService.saveStudentProgress(updatedProgress);
        return prev.map(p =>
          p.classId === classId && p.studentId === currentUser.id ? updatedProgress : p
        );
      } else {
        updatedProgress = {
          classId,
          studentId: currentUser.id,
          completedItemIds: [itemId],
          lastAccessedItemId: itemId,
          updatedAt: new Date().toISOString()
        };
        supabaseService.saveStudentProgress(updatedProgress);
        return [...prev, updatedProgress];
      }
    });
  };

  // Learning Items
  const createLearningItem = (itemData: Omit<LearningItem, 'id'>): LearningItem => {
    const newItem: LearningItem = {
      ...itemData,
      id: `item-${Date.now()}`
    };
    setLearningItems(prev => [...prev, newItem]);

    setClasses(prev =>
      prev.map(c =>
        c.id === itemData.classId
          ? { ...c, totalModules: (c.totalModules || 0) + 1 }
          : c
      )
    );

    supabaseService.saveLearningItem(newItem);
    return newItem;
  };

  const updateLearningItem = (itemId: string, itemData: Partial<LearningItem>) => {
    setLearningItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, ...itemData };
          supabaseService.saveLearningItem(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteLearningItem = (itemId: string) => {
    setLearningItems(prev => prev.filter(item => item.id !== itemId));
    supabaseService.deleteLearningItem(itemId);
  };

  const reorderLearningItems = (classId: string, itemIdsInOrder: string[]) => {
    setLearningItems(prev => {
      const otherItems = prev.filter(i => i.classId !== classId);
      const classItems = prev.filter(i => i.classId === classId);

      const reorderedClassItems = itemIdsInOrder.map((id, index) => {
        const item = classItems.find(i => i.id === id);
        if (item) {
          const updated = { ...item, order: index + 1 };
          supabaseService.saveLearningItem(updated);
          return updated;
        }
        return null;
      }).filter((item): item is LearningItem => item !== null);

      return [...otherItems, ...reorderedClassItems];
    });
  };

  const toggleSessionLock = (classId: string, chapterTitle: string, meetingSession: string, isLocked: boolean) => {
    setLearningItems(prev =>
      prev.map(item => {
        const itemChapter = item.chapterTitle || 'Bab 1: Dasar Logika & Algoritma';
        const itemSession = item.meetingSession || 'Pertemuan 1';
        if (item.classId === classId && itemChapter === chapterTitle && itemSession === meetingSession) {
          const updated = {
            ...item,
            isSessionLocked: isLocked,
            releaseDateLabel: isLocked ? 'Terkunci untuk Pertemuan Berikutnya' : 'Aktif Hari Ini'
          };
          supabaseService.saveLearningItem(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const copyLearningItemToClass = (itemId: string, targetClassIds: string[]) => {
    const sourceItem = learningItems.find(i => i.id === itemId);
    if (!sourceItem || targetClassIds.length === 0) return;

    const newClonedItems: LearningItem[] = [];

    targetClassIds.forEach(targetClassId => {
      const targetClassItems = learningItems.filter(i => i.classId === targetClassId);
      const nextOrder = targetClassItems.length + 1;

      const newItem: LearningItem = {
        ...sourceItem,
        id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        classId: targetClassId,
        order: nextOrder
      };
      newClonedItems.push(newItem);
      supabaseService.saveLearningItem(newItem);
    });

    setLearningItems(prev => [...prev, ...newClonedItems]);

    setClasses(prev =>
      prev.map(c =>
        targetClassIds.includes(c.id)
          ? { ...c, totalModules: (c.totalModules || 0) + 1 }
          : c
      )
    );
  };

  const copySessionToClass = (sourceClassId: string, chapterTitle: string, meetingSession: string, targetClassIds: string[]) => {
    const sessionItems = learningItems.filter(
      i => i.classId === sourceClassId &&
      (i.chapterTitle || 'Bab 1: Dasar Logika & Algoritma') === chapterTitle &&
      (i.meetingSession || 'Pertemuan 1') === meetingSession
    );
    if (sessionItems.length === 0 || targetClassIds.length === 0) return;

    const newClonedItems: LearningItem[] = [];

    targetClassIds.forEach(targetClassId => {
      const targetClassItems = learningItems.filter(i => i.classId === targetClassId);
      let baseOrder = targetClassItems.length;

      sessionItems.forEach(item => {
        baseOrder += 1;
        const newItem: LearningItem = {
          ...item,
          id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          classId: targetClassId,
          order: baseOrder
        };
        newClonedItems.push(newItem);
        supabaseService.saveLearningItem(newItem);
      });
    });

    setLearningItems(prev => [...prev, ...newClonedItems]);

    setClasses(prev =>
      prev.map(c =>
        targetClassIds.includes(c.id)
          ? { ...c, totalModules: (c.totalModules || 0) + sessionItems.length }
          : c
      )
    );
  };

  // Submissions & Grading
  const submitAssessment = (submissionData: Omit<Submission, 'id' | 'submittedAt'>): Submission => {
    const newSubmission: Submission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };

    setSubmissions(prev => [
      newSubmission,
      ...prev.filter(
        s => !(s.learningItemId === submissionData.learningItemId && s.studentId === submissionData.studentId)
      )
    ]);

    supabaseService.saveSubmission(newSubmission);

    // Mark learning item as completed
    markItemAsCompleted(submissionData.classId, submissionData.learningItemId);

    return newSubmission;
  };

  const gradeSubmission = (submissionId: string, score: number, feedback: string) => {
    setSubmissions(prev =>
      prev.map(sub => {
        if (sub.id === submissionId) {
          const updated = {
            ...sub,
            score,
            teacherFeedback: feedback,
            gradedAt: new Date().toISOString()
          };
          supabaseService.saveSubmission(updated);
          return updated;
        }
        return sub;
      })
    );
  };

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <LMSContext.Provider
      value={{
        currentUser,
        users,
        classes,
        classMembers,
        learningItems,
        submissions,
        studentProgressList,
        isCloudConnected: isSupabaseConfigured,
        loginStudent,
        loginTeacher,
        logout,
        changePassword,
        registerStudent,
        deleteStudent,
        resetStudentPassword,
        createClass,
        duplicateClass,
        deleteClass,
        joinClassByCode,
        leaveClass,
        markItemAsCompleted,
        getStudentClassProgress,
        createLearningItem,
        updateLearningItem,
        deleteLearningItem,
        reorderLearningItems,
        toggleSessionLock,
        copyLearningItemToClass,
        copySessionToClass,
        submitAssessment,
        gradeSubmission,
        resetData
      }}
    >
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const context = useContext(LMSContext);
  if (!context) {
    throw new Error('useLMS must be used within an LMSProvider');
  }
  return context;
};
