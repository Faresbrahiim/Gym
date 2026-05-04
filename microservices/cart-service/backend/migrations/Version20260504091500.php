<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260504091500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add stock quantity to products and sync zero-stock products to out-of-stock status.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE products ADD stock_quantity INT DEFAULT 0 NOT NULL');
        $this->addSql("UPDATE products SET status = 'OUT_OF_STOCK' WHERE stock_quantity <= 0 AND status <> 'ARCHIVED'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE products DROP stock_quantity');
    }
}
