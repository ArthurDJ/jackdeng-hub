import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"color" varchar DEFAULT '#3B82F6' NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blogs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  ALTER TABLE "blogs_category" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "blogs_category" CASCADE;
  ALTER TABLE "blogs" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "blogs" ADD COLUMN "category_id" integer;
  ALTER TABLE "blogs" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "blogs" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "blogs" ADD COLUMN "seo_meta_title" varchar;
  ALTER TABLE "blogs" ADD COLUMN "seo_meta_description" varchar;
  ALTER TABLE "blogs" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "media" ADD COLUMN "caption" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "blogs_rels_order_idx" ON "blogs_rels" USING btree ("order");
  CREATE INDEX "blogs_rels_parent_idx" ON "blogs_rels" USING btree ("parent_id");
  CREATE INDEX "blogs_rels_path_idx" ON "blogs_rels" USING btree ("path");
  CREATE INDEX "blogs_rels_tags_id_idx" ON "blogs_rels" USING btree ("tags_id");
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blogs_category_idx" ON "blogs" USING btree ("category_id");
  CREATE INDEX "blogs_seo_seo_og_image_idx" ON "blogs" USING btree ("seo_og_image_id");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  ALTER TABLE "blogs" DROP COLUMN "published_date";
  DROP TYPE "public"."enum_blogs_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blogs_category" AS ENUM('tech', 'life', 'news');
  CREATE TABLE "blogs_category" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_blogs_category",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogs_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "blogs_rels" CASCADE;
  ALTER TABLE "blogs" DROP CONSTRAINT "blogs_category_id_categories_id_fk";
  
  ALTER TABLE "blogs" DROP CONSTRAINT "blogs_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  DROP INDEX "blogs_category_idx";
  DROP INDEX "blogs_seo_seo_og_image_idx";
  DROP INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX "media_sizes_card_sizes_card_filename_idx";
  DROP INDEX "media_sizes_hero_sizes_hero_filename_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "blogs" ALTER COLUMN "cover_image_id" DROP NOT NULL;
  ALTER TABLE "blogs" ALTER COLUMN "status" DROP NOT NULL;
  ALTER TABLE "blogs" ADD COLUMN "published_date" timestamp(3) with time zone;
  ALTER TABLE "blogs_category" ADD CONSTRAINT "blogs_category_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "blogs_category_order_idx" ON "blogs_category" USING btree ("order");
  CREATE INDEX "blogs_category_parent_idx" ON "blogs_category" USING btree ("parent_id");
  ALTER TABLE "blogs" DROP COLUMN "excerpt";
  ALTER TABLE "blogs" DROP COLUMN "category_id";
  ALTER TABLE "blogs" DROP COLUMN "published_at";
  ALTER TABLE "blogs" DROP COLUMN "featured";
  ALTER TABLE "blogs" DROP COLUMN "seo_meta_title";
  ALTER TABLE "blogs" DROP COLUMN "seo_meta_description";
  ALTER TABLE "blogs" DROP COLUMN "seo_og_image_id";
  ALTER TABLE "media" DROP COLUMN "caption";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_card_url";
  ALTER TABLE "media" DROP COLUMN "sizes_card_width";
  ALTER TABLE "media" DROP COLUMN "sizes_card_height";
  ALTER TABLE "media" DROP COLUMN "sizes_card_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_url";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_width";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_height";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filename";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";`)
}
