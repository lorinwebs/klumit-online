import path from 'path';

export interface QuizConfig {
  /** 0-based photo index after which this quiz appears (between this photo and the next). */
  afterPhotoIndex: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  /** Dramatic "שאלה לקהל!! מוכנים?" splash shown before the question. */
  introSec: number;
  countdownSec: number;
  revealSec: number;
}

export interface MovieConfig {
  outputPath: string;
  width: number;
  height: number;
  fps: number;
  intro: {
    logoHoldSec: number;   // logo alone before any text starts
    letterFps: number;     // how many letters appear per second
    holdSec: number;       // hold full text after reveal completes
    title: string;
    year: string;
  };
  photoDurationSec: number;
  crossfadeSec: number;
  photosFolder: string;
  /** Explicit photo file list, or null to auto-discover all images in photosFolder. */
  photos: string[] | null;
  quizzes: QuizConfig[];
  logoPath: string;
}

export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const SCRIPT_DIR = __dirname;

export const DEMO_CONFIG: MovieConfig = {
  outputPath: path.join(REPO_ROOT, 'reunion-movie-demo.mp4'),
  width: 1920,
  height: 1080,
  fps: 30,
  intro: {
    logoHoldSec: 1.5,
    letterFps: 10,
    holdSec: 1.5,
    title: 'מפגש מחזור - 20 שנה',
    year: '2026',
  },
  photoDurationSec: 3,
  crossfadeSec: 0.7,
  photosFolder: path.join(REPO_ROOT, 'app', 'mekif-chet-2007-reunion', 'movie_pictures'),
  photos: null,
  quizzes: [
    {
      afterPhotoIndex: 1,
      question: 'מה התשובה הנכונה?',
      options: ['אוהל', 'בית', 'גמל', 'דירה'],
      correctIndex: 1,
      introSec: 2.2,
      countdownSec: 3,
      revealSec: 3,
    },
  ],
  logoPath: path.join(__dirname, 'assets', 'reunion-logo.png'),
};
