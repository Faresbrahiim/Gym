<?php
// src/Repository/CartRepository.php

namespace App\Repository;

use App\Entity\Cart;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class CartRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Cart::class);
    }

    public function findOneByUserId(Uuid $userId): ?Cart
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.items', 'i')
            ->addSelect('i')
            ->where('c.userId = :val')
            ->setParameter('val', $userId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function save(Cart $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Cart $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}