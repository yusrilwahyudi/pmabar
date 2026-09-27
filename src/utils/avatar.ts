/**
 * Avatar Generator Utility for P Mabar LMS
 * 100% Reliable, Fast, and Clean Vector Avatars:
 * - Siswa: Robot Bottts vector avatar
 * - Guru Laki-laki: Male Teacher with neat haircut, blazer/shirt, and friendly smile
 * - Guru Perempuan: Female Teacher with elegant hijab / style
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
  const cleanSeed = encodeURIComponent(name.replace(/[^a-zA-Z0-9]/g, '') || 'Guru');

  if (finalGender === 'female') {
    // Elegant female teacher with hijab / long hair
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&top=hijab,straight01,longButNotTooLong&eyes=default,happy&mouth=default,smile&facialHairChance=0&accessoriesChance=0&backgroundColor=ffd5dc,ffdfbf,c0aede`;
  }

  // Handsome professional male teacher with short hair, smiling, blazer/shirt
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&top=shortFlat,shortWaved,theCaesar,sides&eyes=default,happy&mouth=default,smile&facialHairChance=0&accessoriesChance=0&clothing=collarAndSweater,shirtCrewNeck&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export function getStudentAvatar(idNumberOrName: string): string {
  const cleanSeed = encodeURIComponent(idNumberOrName.replace(/[^a-zA-Z0-9]/g, '') || 'Siswa');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getUserAvatar(user: { role?: string; name: string; idNumber?: string; avatar?: string; gender?: 'male' | 'female' }): string {
  if (user.role === 'guru') {
    return getTeacherAvatar(user.name, user.gender);
  }

  return getStudentAvatar(user.idNumber || user.name);
}
