/**
 * Avatar Generator Utility for P Mabar LMS
 * Guarantees:
 * - Siswa: Robot Bottts vector avatar
 * - Guru Laki-laki: Handsome, professional male teacher with short hair & friendly smile (no flowers/dizzy faces)
 * - Guru Perempuan: Professional female teacher with elegant hair / hijab & friendly smile
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
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=hijab,longHairBob,longHairStraight,longHairCurly&accessoriesChance=0&facialHairChance=0&eyes=default,happy&mouth=smile,default&eyebrows=defaultNatural,default&clothing=collarAndSweater,shirtCrewNeck&clothingColor=ff5c5c,5199e4,9287ff&backgroundColor=ffd5dc,ffdfbf,c0aede`;
  }

  // Male Teacher: strictly short male hair, smile, collar sweater/shirt
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=shortHairShortFlat,shortHairShortWaved,shortHairTheCaesar,shortHairSides&accessoriesChance=0&facialHairChance=0&eyes=default,happy&mouth=smile,default&eyebrows=defaultNatural,default&clothing=collarAndSweater,shirtCrewNeck&clothingColor=262e33,5199e4,25557c&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export function getStudentAvatar(idNumberOrName: string): string {
  const seed = encodeURIComponent(idNumberOrName.trim() || 'Siswa');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getUserAvatar(user: { role?: string; name: string; idNumber?: string; avatar?: string; gender?: 'male' | 'female' }): string {
  if (user.role === 'guru') {
    return getTeacherAvatar(user.name, user.gender);
  }

  return getStudentAvatar(user.idNumber || user.name);
}
