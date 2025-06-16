import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateLockHistoryTable1718089368000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if we're using SQLite for test environment
    const isTestEnv = process.env.NODE_ENV === "test";
    
    await queryRunner.createTable(
      new Table({
        name: "lock_history",
        columns: [
          {
            name: "id",
            type: isTestEnv ? "varchar" : "uuid",
            isPrimary: true,
            generationStrategy: isTestEnv ? undefined : "uuid",
            default: isTestEnv ? undefined : "uuid_generate_v4()",
            length: isTestEnv ? "36" : undefined
          },
          {
            name: "appointment_id",
            type: "varchar",
            isNullable: false
          },
          {
            name: "user_id",
            type: "varchar",
            isNullable: false
          },
          {
            name: "user_name",
            type: "varchar",
            isNullable: false
          },
          {
            name: "user_email",
            type: "varchar",
            isNullable: false
          },
          {
            name: "action",
            type: "varchar",
            length: "50",
            default: "'acquired'",
            isNullable: false
          },
          {
            name: "timestamp",
            type: isTestEnv ? "datetime" : "timestamp",
            default: isTestEnv ? "CURRENT_TIMESTAMP" : "now()"
          },
          {
            name: "duration",
            type: "integer",
            isNullable: true
          },
          {
            name: "released_by",
            type: "varchar",
            isNullable: true
          },
          {
            name: "lock_id",
            type: "varchar",
            isNullable: true
          },
          {
            name: "metadata",
            type: isTestEnv ? "text" : "jsonb",
            isNullable: true
          }
        ]
      }),
      true
    );

    await queryRunner.createIndex(
      "lock_history",
      new TableIndex({
        name: "idx_lock_history_appointment_id",
        columnNames: ["appointment_id"]
      })
    );

    await queryRunner.createIndex(
      "lock_history",
      new TableIndex({
        name: "idx_lock_history_user_id",
        columnNames: ["user_id"]
      })
    );

    await queryRunner.createIndex(
      "lock_history",
      new TableIndex({
        name: "idx_lock_history_timestamp",
        columnNames: ["timestamp"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("lock_history", "idx_lock_history_appointment_id");
    await queryRunner.dropIndex("lock_history", "idx_lock_history_user_id");
    await queryRunner.dropIndex("lock_history", "idx_lock_history_timestamp");
    await queryRunner.dropTable("lock_history");
  }
} 