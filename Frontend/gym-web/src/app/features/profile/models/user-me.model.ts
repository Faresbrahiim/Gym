export interface UserProfileData {
  firstName: string;
  lastName: string;
  phone: string | null;
  profilePictureUrl: string | null;
}

export interface MemberProfileData {
  gender: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  fitnessGoal: string | null;
  experienceLevel: number | null;
}

export interface CoachProfileData {
  bio: string | null;
  yearsOfExperience: number | null;
  certifications: string | null;
  language: string;
}

export interface UserMe {
  id: string;
  email: string;
  username: string;
  role: string;
  profile: UserProfileData | null;
  memberProfile: MemberProfileData | null;
  coachProfile: CoachProfileData | null;
}
