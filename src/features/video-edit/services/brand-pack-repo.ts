import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_BRAND_TOKENS, type BrandPackTokens } from './timeline-builder'

/**
 * Lee el brand pack de Supabase y lo mapea a los tokens que usa el timeline-builder.
 * Si no hay fila (slug='default'), devuelve los defaults compilados.
 */
export async function loadBrandPackTokens(
  supabase: SupabaseClient,
  slug: string = 'default',
): Promise<BrandPackTokens> {
  const { data, error } = await supabase
    .from('ci_brand_pack')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return DEFAULT_BRAND_TOKENS
  }

  return {
    subtitleFontFamily: data.subtitle_font_family ?? DEFAULT_BRAND_TOKENS.subtitleFontFamily,
    subtitleFontWeight: data.subtitle_font_weight ?? DEFAULT_BRAND_TOKENS.subtitleFontWeight,
    subtitleFontSizeRelative:
      (data.subtitle_font_size_relative as BrandPackTokens['subtitleFontSizeRelative']) ??
      DEFAULT_BRAND_TOKENS.subtitleFontSizeRelative,
    subtitleColor: data.subtitle_color ?? DEFAULT_BRAND_TOKENS.subtitleColor,
    subtitleEmphasisStyle:
      (data.subtitle_emphasis_style as BrandPackTokens['subtitleEmphasisStyle']) ??
      DEFAULT_BRAND_TOKENS.subtitleEmphasisStyle,
    subtitleEmphasisColor: data.subtitle_emphasis_color ?? null,
    subtitlePosition:
      (data.subtitle_position as BrandPackTokens['subtitlePosition']) ??
      DEFAULT_BRAND_TOKENS.subtitlePosition,
    subtitleAnimation:
      (data.subtitle_animation as BrandPackTokens['subtitleAnimation']) ??
      DEFAULT_BRAND_TOKENS.subtitleAnimation,
    subtitleMaxVisibleWords:
      data.subtitle_max_visible_words ?? DEFAULT_BRAND_TOKENS.subtitleMaxVisibleWords,
    subtitleBackgroundColor: data.subtitle_background_color ?? null,
    subtitleBackgroundOpacity: Number(data.subtitle_background_opacity ?? 0),

    variant2BarHeightPx:
      data.variant2_bar_height_px ?? DEFAULT_BRAND_TOKENS.variant2BarHeightPx,
    variant2BarColor: data.variant2_bar_color ?? DEFAULT_BRAND_TOKENS.variant2BarColor,
    variant2HeadlineFontFamily:
      data.variant2_headline_font_family ??
      DEFAULT_BRAND_TOKENS.variant2HeadlineFontFamily,
    variant2HeadlineColor:
      data.variant2_headline_color ?? DEFAULT_BRAND_TOKENS.variant2HeadlineColor,

    variant3KeywordSizeMultiplier: Number(
      data.variant3_keyword_size_multiplier ??
        DEFAULT_BRAND_TOKENS.variant3KeywordSizeMultiplier,
    ),
    variant3KeywordAccentColor: data.variant3_keyword_accent_color ?? null,

    colorGradeLut: data.color_grade_lut ?? DEFAULT_BRAND_TOKENS.colorGradeLut,
    colorGradeIntensity: Number(
      data.color_grade_intensity ?? DEFAULT_BRAND_TOKENS.colorGradeIntensity,
    ),

    aspectRatio:
      (data.aspect_ratio as BrandPackTokens['aspectRatio']) ??
      DEFAULT_BRAND_TOKENS.aspectRatio,
    resolution:
      (data.resolution as BrandPackTokens['resolution']) ??
      DEFAULT_BRAND_TOKENS.resolution,
    fps: (data.fps as BrandPackTokens['fps']) ?? DEFAULT_BRAND_TOKENS.fps,

    silenceThresholdMs:
      data.silence_threshold_ms ?? DEFAULT_BRAND_TOKENS.silenceThresholdMs,
  }
}
