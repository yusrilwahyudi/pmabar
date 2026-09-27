/**
 * Avatar Generator Utility for P Mabar LMS
 * Tailored for Indonesian Teachers & Students:
 * - Siswa: Robot Bottts vector avatar
 * - Guru Laki-laki: Guru pria rapi (rambut hitam tebal/rapi, kulit kuning langsat/sawo matang cerah alami, kemeja rapi)
 * - Guru Perempuan: Guru wanita elegan (hijab/rambut rapi, kulit cerah alami)
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
    // Guru Wanita: Hijab / rambut rapi, kulit cerah, senyum ramah
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&top=hijab,straight01,longButNotTooLong&hairColor=2c1b18,4a312c,000000&skinColor=edb98a,f8d25c,ffdbb4&eyes=default,happy&mouth=default,smile&facialHairChance=0&accessoriesChance=0&clothing=collarAndSweater,shirtCrewNeck&clothingColor=ff5c5c,5199e4,9287ff&backgroundColor=ffd5dc,ffdfbf,c0aede`;
  }

  // Guru Pria: Rambut hitam rapi tebal (bukan botak), kulit kuning langsat/cerah, kemeja profesional
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanSeed}&top=shortFlat,shortWaved,theCaesar&hairColor=2c1b18,4a312c,000000&skinColor=edb98a,f8d25c,ffdbb4&eyes=default,happy&mouth=default,smile&facialHairChance=0&accessoriesChance=0&clothing=collarAndSweater,shirtCrewNeck&clothingColor=262e33,5199e4,25557c&backgroundColor=b6e3f4,c0aede,d1d4f9`;
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
