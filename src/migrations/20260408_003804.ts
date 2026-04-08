import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'zh');
  CREATE TABLE "blogs_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar,
  	"content" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "blogs" ALTER COLUMN "cover_image_id" DROP NOT NULL;
  ALTER TABLE "blogs" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "blogs_locales" ADD CONSTRAINT "blogs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "blogs_locales_locale_parent_id_unique" ON "blogs_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "blogs" DROP COLUMN "title";
  ALTER TABLE "blogs" DROP COLUMN "excerpt";
  ALTER TABLE "blogs" DROP COLUMN "content";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "blogs_locales" CASCADE;
  ALTER TABLE "blogs" ALTER COLUMN "cover_image_id" SET NOT NULL;
  ALTER TABLE "blogs" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "blogs" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "blogs" ADD COLUMN "excerpt" varchar NOT NULL;
  ALTER TABLE "blogs" ADD COLUMN "content" jsonb NOT NULL;
  DROP TYPE "public"."_locales";`)
}
