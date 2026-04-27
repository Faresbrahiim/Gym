<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Booking;
use App\Enum\BookingStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Booking>
 */
class BookingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Booking::class);
    }

    public function save(Booking $booking, bool $flush = true): void
    {
        $this->getEntityManager()->persist($booking);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findActiveBySessionAndUser(Uuid $sessionId, Uuid $userId): ?Booking
    {
        return $this->createQueryBuilder('b')
            ->where('IDENTITY(b.session) = :sessionId')
            ->andWhere('b.userId = :userId')
            ->andWhere('b.status IN (:activeStatuses)')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->setParameter('userId', $userId, UuidType::NAME)
            ->setParameter('activeStatuses', [BookingStatus::PENDING->value, BookingStatus::ACCEPTED->value])
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countAcceptedBySession(Uuid $sessionId): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('IDENTITY(b.session) = :sessionId')
            ->andWhere('b.status = :status')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->setParameter('status', BookingStatus::ACCEPTED->value)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Booking[] */
    public function findBySessionPaginated(Uuid $sessionId, int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('IDENTITY(b.session) = :sessionId')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countBySession(Uuid $sessionId): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('IDENTITY(b.session) = :sessionId')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Booking[] */
    public function findByUserPaginated(Uuid $userId, int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('b.userId = :userId')
            ->setParameter('userId', $userId, UuidType::NAME)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countByUser(Uuid $userId): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.userId = :userId')
            ->setParameter('userId', $userId, UuidType::NAME)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
