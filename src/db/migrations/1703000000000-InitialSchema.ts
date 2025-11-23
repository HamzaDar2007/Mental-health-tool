import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1703000000000 implements MigrationInterface {
  name = 'InitialSchema1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_seen" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "consented" boolean NOT NULL DEFAULT false,
        "locale" character varying,
        "age_range" character varying,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_activity" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "consented" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "safe_mode" boolean NOT NULL DEFAULT false,
        "safe_mode_expires" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "role" character varying NOT NULL CHECK ("role" IN ('user', 'bot', 'system', 'human')),
        "content" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "anonymized" boolean NOT NULL DEFAULT false,
        "flagged" boolean NOT NULL DEFAULT false,
        "classifier" jsonb,
        "crisis_detected" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "helplines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "country_code" character varying(2) NOT NULL,
        "region" character varying,
        "description" text NOT NULL,
        "phone" character varying NOT NULL,
        "type" character varying NOT NULL CHECK ("type" IN ('emergency', 'suicide', 'general', 'child', 'women', 'local_service')),
        "priority" integer NOT NULL DEFAULT 1,
        "metadata" jsonb,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_helplines" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "techniques" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "title" character varying NOT NULL,
        "locale" character varying NOT NULL DEFAULT 'en',
        "steps" text array NOT NULL,
        "duration_seconds" integer NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "description" text,
        "category" character varying,
        CONSTRAINT "PK_techniques" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_techniques_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_type" character varying NOT NULL,
        "payload" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid,
        "session_id" uuid,
        "ip_address" inet,
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "human_review_queue" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "message_id" uuid,
        "status" character varying NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'reviewing', 'resolved')),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "assigned_to" character varying,
        "notes" text,
        "crisis_level" integer,
        "metadata" jsonb,
        CONSTRAINT "PK_human_review_queue" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_last_activity" ON "sessions" ("last_activity")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_session_id" ON "messages" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_created_at" ON "messages" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_crisis_detected" ON "messages" ("crisis_detected")`);
    await queryRunner.query(`CREATE INDEX "IDX_helplines_country_type" ON "helplines" ("country_code", "type")`);
    await queryRunner.query(`CREATE INDEX "IDX_helplines_active" ON "helplines" ("active")`);
    await queryRunner.query(`CREATE INDEX "IDX_techniques_locale_active" ON "techniques" ("locale", "active")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_log_event_type" ON "audit_log" ("event_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_log_created_at" ON "audit_log" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_queue_status" ON "human_review_queue" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_queue_crisis_level" ON "human_review_queue" ("crisis_level")`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_human_review_queue_updated_at 
      BEFORE UPDATE ON "human_review_queue" 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_human_review_queue_updated_at ON "human_review_queue"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
    await queryRunner.query(`DROP TABLE "human_review_queue"`);
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(`DROP TABLE "techniques"`);
    await queryRunner.query(`DROP TABLE "helplines"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}