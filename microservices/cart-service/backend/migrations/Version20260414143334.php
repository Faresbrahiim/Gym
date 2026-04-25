<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260414143334 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cart_items (id UUID NOT NULL, quantity INT NOT NULL, cart_id UUID NOT NULL, product_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_BEF484451AD5CDBF ON cart_items (cart_id)');
        $this->addSql('CREATE INDEX IDX_BEF484454584665A ON cart_items (product_id)');
        $this->addSql('CREATE UNIQUE INDEX uq_cart_product ON cart_items (cart_id, product_id)');
        $this->addSql('CREATE TABLE carts (id UUID NOT NULL, user_id UUID NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_4E004AACA76ED395 ON carts (user_id)');
        $this->addSql('CREATE TABLE order_items (id UUID NOT NULL, price NUMERIC(10, 2) NOT NULL, quantity INT NOT NULL, order_id UUID NOT NULL, product_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_62809DB08D9F6D38 ON order_items (order_id)');
        $this->addSql('CREATE INDEX IDX_62809DB04584665A ON order_items (product_id)');
        $this->addSql('CREATE TABLE orders (id UUID NOT NULL, user_id UUID NOT NULL, status VARCHAR(20) NOT NULL, total_price NUMERIC(10, 2) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE TABLE products (id UUID NOT NULL, name VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, price NUMERIC(10, 2) NOT NULL, status VARCHAR(20) NOT NULL, image_path VARCHAR(255) DEFAULT NULL, image_data TEXT DEFAULT NULL, image_mime_type VARCHAR(100) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('ALTER TABLE cart_items ADD CONSTRAINT FK_BEF484451AD5CDBF FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE cart_items ADD CONSTRAINT FK_BEF484454584665A FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE order_items ADD CONSTRAINT FK_62809DB08D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE order_items ADD CONSTRAINT FK_62809DB04584665A FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE cart_items DROP CONSTRAINT FK_BEF484451AD5CDBF');
        $this->addSql('ALTER TABLE cart_items DROP CONSTRAINT FK_BEF484454584665A');
        $this->addSql('ALTER TABLE order_items DROP CONSTRAINT FK_62809DB08D9F6D38');
        $this->addSql('ALTER TABLE order_items DROP CONSTRAINT FK_62809DB04584665A');
        $this->addSql('DROP TABLE cart_items');
        $this->addSql('DROP TABLE carts');
        $this->addSql('DROP TABLE order_items');
        $this->addSql('DROP TABLE orders');
        $this->addSql('DROP TABLE products');
    }
}
