import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794947115672 implements MigrationInterface {
  name = 'InitialSchema1794947115672';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    await queryRunner.query(`CREATE TYPE user_role AS ENUM ('REQUESTER', 'VALIDATOR')`);
    await queryRunner.query(
      `CREATE TYPE vacation_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE vacation_request_event_type AS ENUM ('SUBMITTED', 'UPDATED', 'APPROVED', 'REJECTED')`,
    );

    await queryRunner.query(`
      CREATE TABLE users (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name varchar(120) NOT NULL,
        email varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        role user_role NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_users_email UNIQUE (email)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE vacation_requests (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        start_date date NOT NULL,
        end_date date NOT NULL,
        reason text,
        status vacation_request_status NOT NULL DEFAULT 'PENDING',
        comments text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_vacation_requests_date_order CHECK (end_date >= start_date),
        CONSTRAINT chk_vacation_requests_rejection_comment
          CHECK (status <> 'REJECTED' OR (comments IS NOT NULL AND length(btrim(comments)) > 0)),
        CONSTRAINT excl_vacation_requests_no_overlap
          EXCLUDE USING gist (user_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
          WHERE (status <> 'REJECTED')
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_vacation_requests_user_start ON vacation_requests (user_id, start_date DESC, id DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vacation_requests_status_created ON vacation_requests (status, created_at DESC, id DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE vacation_request_events (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        vacation_request_id integer NOT NULL REFERENCES vacation_requests (id) ON DELETE CASCADE,
        type vacation_request_event_type NOT NULL,
        actor_user_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        details jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_vacation_request_events_request_created ON vacation_request_events (vacation_request_id, created_at, id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE vacation_request_events`);
    await queryRunner.query(`DROP TABLE vacation_requests`);
    await queryRunner.query(`DROP TABLE users`);
    await queryRunner.query(`DROP TYPE vacation_request_event_type`);
    await queryRunner.query(`DROP TYPE vacation_request_status`);
    await queryRunner.query(`DROP TYPE user_role`);
  }
}
