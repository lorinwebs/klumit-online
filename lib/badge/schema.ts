import { z } from 'zod';

export const GRADES = [
  'יב1','יב2','יב3','יב4','יב5',
  'יב6','יב7','יב8','יב9','יב10',
] as const;

export type Grade = typeof GRADES[number];

export const GRADE_LABELS: Record<Grade, string> = {
  'יב1':  'י"ב 1',
  'יב2':  'י"ב 2',
  'יב3':  'י"ב 3',
  'יב4':  'י"ב 4',
  'יב5':  'י"ב 5',
  'יב6':  'י"ב 6',
  'יב7':  'י"ב 7',
  'יב8':  'י"ב 8',
  'יב9':  'י"ב 9',
  'יב10': 'י"ב 10',
};

export function formatGrade(grade: string): string {
  return GRADE_LABELS[grade as Grade] ?? grade;
}

export const GENDERS = ['male', 'female'] as const;
export type Gender = typeof GENDERS[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'זכר',
  female: 'נקבה',
};

export const MARITAL_STATUSES = ['single', 'married', 'other'] as const;
export type MaritalStatus = typeof MARITAL_STATUSES[number];

export function getMaritalLabel(status: MaritalStatus, gender: Gender, otherStatus?: string, numChildren?: number): string {
  const labels: Record<MaritalStatus, Record<Gender, string>> = {
    single:  { male: 'רווק',  female: 'רווקה' },
    married: { male: 'נשוי',  female: 'נשואה' },
    other:   { male: 'אחר',   female: 'אחר' },
  };
  let label = status === 'other' && otherStatus ? otherStatus : (labels[status]?.[gender] ?? status);
  if (numChildren && numChildren > 0) {
    label += ` +${numChildren}`;
  }
  return label;
}

export const badgeSchema = z.object({
  first_name:     z.string().min(2, 'שם פרטי חובה').max(20).trim(),
  last_name:      z.string().max(20).trim().default(''),
  gender:         z.enum(GENDERS, { required_error: 'יש לבחור מגדר' }),
  marital_status: z.enum(MARITAL_STATUSES, { required_error: 'יש לבחור סטטוס' }),
  other_status:   z.string().max(10).trim().optional().default(''),
  married_name:   z.string().max(20).trim().optional().default(''),
  grade:          z.enum(GRADES, { required_error: 'כיתה חובה' }),
  city:           z.string().min(2, 'עיר חובה').max(30).trim(),
  occupation:     z.string().min(2, 'עיסוק חובה').max(30).trim(),
  num_children:   z.coerce.number().int().min(0).max(20).optional().default(0),
  monday_name:    z.string().max(50).trim().default(''),
  _hp:            z.literal('').optional(),
});

export type BadgeFormData = z.infer<typeof badgeSchema>;

/** Build full_name for display on the badge */
export function buildDisplayName(data: {
  first_name: string;
  last_name: string;
  marital_status?: string;
  married_name?: string;
}): string {
  const { first_name, last_name, married_name } = data;
  if (married_name && married_name !== last_name) {
    return `${first_name} (${last_name}) ${married_name}`;
  }
  return `${first_name} ${last_name}`;
}
