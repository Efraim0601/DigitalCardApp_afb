export type LabelDto = {
  id: string;
  labelFr: string;
  labelEn: string;
};

export type TemplateId = 'classic' | 'modern';

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
  templateId?: string | null;
};

export type CardPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type CardBackgroundSize = 'cover' | 'contain' | '100% 100%';

export type CardBackgroundConfig = {
  cardBackground?: string | null;
  contentPadding?: CardPadding;
  backgroundSize?: CardBackgroundSize;
};
