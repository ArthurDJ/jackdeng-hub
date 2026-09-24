import { sql } from '@payloadcms/db-postgres'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * The two columns Payload 3.90 adds, found by the CI schema-drift check
 * (scripts/schema-drift.ts) as the only differences between the migrations
 * and the upgraded code:
 *
 * - users.reset_password_requested_at — 3.90 throttles forgot-password and
 *   clears lockouts on reset, and records when a reset was last requested.
 *   Existing users have never requested one: nullable, no default.
 *
 * - media._objectkey — the cloud-storage plugin (Vercel Blob here) now keeps
 *   a per-upload folder segment apart from the semantic prefix. Null for
 *   every existing file, which the plugin treats as "prefix only": the same
 *   path those files were stored under, so their URLs do not change.
 *
 * Both are additive and must run BEFORE the 3.90 deploy: 3.90 selects these
 * columns on every read of users and media, so without them the admin login
 * and any page with an image would fail. The build still live on 3.89 does
 * not know them and ignores them.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
  `)
}
