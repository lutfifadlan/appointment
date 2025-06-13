import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAppointmentLockTable1718089365000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "appointment_locks",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()"
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
            name: "user_info",
            type: "jsonb",
            isNullable: false
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()"
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: false
          }
        ]
      }),
      true
    );

    await queryRunner.createIndex(
      "appointment_locks",
      new TableIndex({
        name: "idx_appointment_locks_appointment_id",
        columnNames: ["appointment_id"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("appointment_locks", "idx_appointment_locks_appointment_id");
    await queryRunner.dropTable("appointment_locks");
  }
}
