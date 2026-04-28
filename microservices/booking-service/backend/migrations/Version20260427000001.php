<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260427000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create court_sessions and bookings tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE court_sessions (
                id                        UUID         NOT NULL,
                coach_id                  UUID         NOT NULL,
                coach_full_name           VARCHAR(255) NOT NULL,
                coach_profile_picture_url VARCHAR(500) NOT NULL,
                title                     VARCHAR(255) NOT NULL,
                description               TEXT         DEFAULT NULL,
                start_time                TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                end_time                  TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                max_participants          INT          NOT NULL,
                status                    VARCHAR(20)  NOT NULL,
                created_at                TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at                TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);

        $this->addSql(<<<'SQL'
            CREATE TABLE bookings (
                id                       UUID         NOT NULL,
                session_id               UUID         NOT NULL,
                user_id                  UUID         NOT NULL,
                user_full_name           VARCHAR(255) NOT NULL,
                user_profile_picture_url VARCHAR(500) NOT NULL,
                status                   VARCHAR(20)  NOT NULL,
                created_at               TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                updated_at               TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )
        SQL);

        $this->addSql('CREATE INDEX idx_court_sessions_coach_id ON court_sessions (coach_id)');
        $this->addSql('CREATE INDEX idx_court_sessions_status   ON court_sessions (status)');

        $this->addSql('CREATE INDEX        idx_bookings_session_id         ON bookings (session_id)');
        $this->addSql('CREATE INDEX        idx_bookings_user_id            ON bookings (user_id)');
        $this->addSql('CREATE UNIQUE INDEX uq_booking_session_user         ON bookings (session_id, user_id)');

        $this->addSql(<<<'SQL'
            ALTER TABLE bookings
                ADD CONSTRAINT fk_bookings_session_id
                FOREIGN KEY (session_id) REFERENCES court_sessions (id) ON DELETE CASCADE
                NOT DEFERRABLE INITIALLY IMMEDIATE
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bookings DROP CONSTRAINT fk_bookings_session_id');
        $this->addSql('DROP TABLE bookings');
        $this->addSql('DROP TABLE court_sessions');
    }
}
