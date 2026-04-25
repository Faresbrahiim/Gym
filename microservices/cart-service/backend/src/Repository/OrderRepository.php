<?php
namespace App\Repository;

use App\Entity\Order;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/** @extends ServiceEntityRepository<Order> */
class OrderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Order::class);
    }

    /** @return Order[] */
    public function findAllByUser(Uuid $userId): array
    {
        return $this->createQueryBuilder('o')
            ->leftJoin('o.items', 'i')
            ->addSelect('i')
            ->where('o.userId = :val')
            ->setParameter('val', $userId->toBinary())
            ->orderBy('o.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function save(Order $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}