import z from 'zod';

export const priceCardVariantSchema = z.enum(['basic', 'pro', 'enterprise']);

export const productMetadataSchema = z
  .object({
    price_card_variant: priceCardVariantSchema.default('basic'),
    generated_images: z.string().optional(),
    image_editor: z.enum(['basic', 'pro']).default('basic'),
    support_level: z.enum(['email', 'live']).default('email'),
  })
  .transform((data) => ({
    priceCardVariant: data.price_card_variant,
    generatedImages: data.generated_images ? parseInt(data.generated_images) : 'enterprise',
    imageEditor: data.image_editor,
    supportLevel: data.support_level,
  }));

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type PriceCardVariant = z.infer<typeof priceCardVariantSchema>;