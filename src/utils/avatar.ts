/**
 * Avatar Generator Utility for P Mabar LMS
 * Supports:
 * - Siswa: Robot Bottts vector avatar
 * - Guru Laki-laki: Illustrated Male Teacher avatar
 * - Guru Perempuan: Illustrated Female Teacher (including hijab / modern styles)
 */

export function detectTeacherGender(name: string): 'male' | 'female' {
  const lower = name.toLowerCase();
  
  // Female keywords & typical Indonesian female names/titles
  const femalePatterns = [
    /\bibu\b/, /\bny\b/, /\bdra\b/, /\bhj\b/, /\bhajjah\b/,
    /\bnur\b/, /\bsiti\b/, /\bputri\b/, /\bayu\b/, /\bdewi\b/,
    /\brina\b/, /\bfitri\b/, /\brahma\b/, /\bwati\b/, /\bindah\b/,
    /\bsri\b/, /\bmaya\b/, /\blestari\b/, /\bningsih\b/, /\bkusuma\b/,
    /\bfatma\b/, /\bzahra\b/, /\byuliana\b/, /\bkartika\b/, /\banisa\b/,
    /\bmutia\b/, /\brini\b/, /\bwulandari\b/, /\bnovita\b/, /\bdian\b/
  ];

  if (femalePatterns.some(pattern => pattern.test(lower))) {
    return 'female';
  }

  return 'male';
}

export function getTeacherAvatar(name: string, gender?: 'male' | 'female'): string {
  const finalGender = gender || detectTeacherGender(name);
  const seed = encodeURIComponent(name.trim() || 'Guru');

  if (finalGender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=female&facialHairChance=0&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  // Male Teacher
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=male&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getStudentAvatar(idNumberOrName: string): string {
  const seed = encodeURIComponent(idNumberOrName.trim() || 'Siswa');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getUserAvatar(user: { role?: string; name: string; idNumber?: string; avatar?: string; gender?: 'male' | 'female' }): string {
  if (user.avatar && !user.avatar.includes('images.unsplash.com')) {
    return user.avatar;
  }

  if (user.role === 'guru') {
    return getTeacherAvatar(user.name, user.gender);
  }

  return getStudentAvatar(user.idNumber || user.name);
}
