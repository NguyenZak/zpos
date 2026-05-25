alter table organizations drop constraint if exists storefront_features_keys;
drop table if exists storefront_block_overrides;

alter table organizations
  drop column if exists storefront_theme,
  drop column if exists storefront_features,
  drop column if exists storefront_custom_css,
  drop column if exists storefront_custom_head,
  drop column if exists storefront_block_whitelist;
