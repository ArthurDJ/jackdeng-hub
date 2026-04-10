import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "mfa_enabled";
  ALTER TABLE "users" DROP COLUMN "mfa_secret";
  ALTER TABLE "users" DROP COLUMN "email_mfa_enabled";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "mfa_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "mfa_secret" varchar;
  ALTER TABLE "users" ADD COLUMN "email_mfa_enabled" boolean DEFAULT false;`)
}
