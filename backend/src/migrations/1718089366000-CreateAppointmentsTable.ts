import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAppointmentsTable1718089366000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "appointments",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()"
          },
          {
            name: "title",
            type: "varchar",
            isNullable: false
          },
          {
            name: "description",
            type: "text",
            isNullable: true
          },
          {
            name: "start_date",
            type: "timestamp",
            isNullable: false
          },
          {
            name: "end_date",
            type: "timestamp",
            isNullable: false
          },
          {
            name: "status",
            type: "enum",
            enum: ["scheduled", "completed", "cancelled"],
            default: "'scheduled'"
          },
          {
            name: "location",
            type: "varchar",
            isNullable: true
          },
          {
            name: "organizer",
            type: "varchar",
            isNullable: true
          },
          {
            name: "attendees",
            type: "text",
            isNullable: true
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()"
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()"
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("appointments");
  }
}
