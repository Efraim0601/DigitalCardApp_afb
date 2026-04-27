import { CardBackgroundSize, CardPadding, TemplateId } from './card.model';

export type CardTemplate = {
  id: TemplateId;
  background: string;
  labelKey: string;
  /** Inner padding in px against the 600x340 card box, sized to avoid each background's decorative zones. */
  contentPadding: CardPadding;
  backgroundSize: CardBackgroundSize;
};

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'classic',
    background: 'assets/carte-digitale-bg.png',
    labelKey: 'admin.appearance.templates.classic',
    contentPadding: { top: 113, right: 32, bottom: 20, left: 32 },
    backgroundSize: 'cover'
  },
  {
    id: 'modern',
    background: 'assets/background_new.jpg',
    labelKey: 'admin.appearance.templates.modern',
    contentPadding: { top: 95, right: 24, bottom: 45, left: 110 },
    backgroundSize: '100% 100%'
  }
];

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic';

export function isValidTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && CARD_TEMPLATES.some((t) => t.id === value);
}

export function getTemplate(id: string | null | undefined): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.id === id) ?? CARD_TEMPLATES[0];
}
