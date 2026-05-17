export type FaceEntry = { count: number; desc: string; score?: number } | number;

export type PhotoFile = {
  path: string;
  name: string;
  uploader: string;
  created_at: string;
};

export type PhotoType = 'group' | 'solo' | 'unknown';

export type HumanChoice = 'yes' | 'no' | null;

export type ReviewEntry = {
  auto: boolean;
  human: HumanChoice;
};

export type ReviewState = Record<string, ReviewEntry>;
