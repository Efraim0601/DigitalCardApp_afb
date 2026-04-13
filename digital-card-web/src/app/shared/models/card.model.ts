export type LabelDto = {
  id: string;
  labelFr: string;
  labelEn: string;
};

// Mirrors Spring Boot CardDto (vcard-api)
export type Card = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  department?: LabelDto | null;
  jobTitle?: LabelDto | null;
  shareCount?: number | null;
};

export type CardBackgroundConfig = {
  cardBackground?: string | null;
};

