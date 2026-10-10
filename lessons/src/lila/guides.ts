// All lesson explanations and examples share the reviewed guide content.
import { GUIDE_CONTENT } from '../../../shared/guide-content.js';
import type { Demo } from './demo';

export const GUIDES: Record<string, Demo[]> = Object.fromEntries(
  Object.entries(GUIDE_CONTENT.stage).map(([key, guide]: [string, any]) => [key, guide.slides]),
);
export const guideSlides = (key: string) => GUIDES[key] || [];
export const guideIntro = (key: string) => (GUIDE_CONTENT.stage as Record<string, { intro: string }>)[key]?.intro || '';
export const GUIDE_ICON: Record<string, string> = { rook: '♜', bishop: '♝', queen: '♛', king: '♚', knight: '♞', pawn: '♟' };
