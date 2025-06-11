import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentLockTable1718089365000 implements MigrationInterface {
    name = 'CreateAppointmentLockTable1718089365000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "appointment_locks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "appointmentId" character varying NOT NULL,
                "userId" character varying NOT NULL,
                "userInfo" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "expiresAt" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_appointment_locks" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_appointment_id" ON "appointment_locks" ("appointmentId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_appointment_id"`);
        await queryRunner.query(`DROP TABLE "appointment_locks"`);
    }
}
