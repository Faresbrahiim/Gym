<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Booking;
use App\Entity\CourtSession;
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

    public function findActiveBySessionAndUser(CourtSession $session, Uuid $userId): ?Booking
    {
        return $this->createQueryBuilder('b')
            ->where('b.session = :session')
            ->andWhere('b.userId = :userId')
            ->andWhere('b.status IN (:activeStatuses)')
            ->setParameter('session', $session)
            ->setParameter('userId', $userId, UuidType::NAME)
            ->setParameter('activeStatuses', [BookingStatus::PENDING->value, BookingStatus::ACCEPTED->value])
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countAcceptedBySession(CourtSession $session): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.session = :session')
            ->andWhere('b.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', BookingStatus::ACCEPTED->value)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Booking[] */
    public function findBySessionPaginated(CourtSession $session, int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('b')
            ->where('b.session = :session')
            ->setParameter('session', $session)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countBySession(CourtSession $session): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.session = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Booking[] */
    public function findByUserPaginated(Uuid $userId, int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('b')
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
