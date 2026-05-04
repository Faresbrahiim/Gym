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

    public function flush(): void
    {
        $this->getEntityManager()->flush();
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

    public function findBySessionAndUser(Uuid $sessionId, Uuid $userId): ?Booking
    {
        return $this->createQueryBuilder('b')
            ->where('IDENTITY(b.session) = :sessionId')
            ->andWhere('b.userId = :userId')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->setParameter('userId', $userId, UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /** @return Booking[] */
    public function findFutureActiveByUser(Uuid $userId, \DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('b.userId = :userId')
            ->andWhere('b.status IN (:activeStatuses)')
            ->andWhere('s.startTime > :now')
            ->setParameter('userId', $userId, UuidType::NAME)
            ->setParameter('activeStatuses', [BookingStatus::PENDING->value, BookingStatus::ACCEPTED->value])
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
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

    /**
     * @param Uuid[] $sessionIds
     * @return array<string, int>
     */
    public function countAcceptedBySessionIds(array $sessionIds): array
    {
        if ($sessionIds === []) {
            return [];
        }

        $sessionIdStrings = array_map(
            static fn (Uuid $sessionId): string => $sessionId->toRfc4122(),
            $sessionIds,
        );

        $rows = $this->createQueryBuilder('b')
            ->select('IDENTITY(b.session) AS sessionId, COUNT(b.id) AS acceptedCount')
            ->where('IDENTITY(b.session) IN (:sessionIds)')
            ->andWhere('b.status = :status')
            ->setParameter('sessionIds', $sessionIdStrings)
            ->setParameter('status', BookingStatus::ACCEPTED->value)
            ->groupBy('b.session')
            ->getQuery()
            ->getArrayResult();

        $counts = [];
        foreach ($rows as $row) {
            $counts[(string) $row['sessionId']] = (int) $row['acceptedCount'];
        }

        return $counts;
    }

    /** @return Booking[] */
    public function findBySessionPaginated(Uuid $sessionId, int $page, int $pageSize, \DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('IDENTITY(b.session) = :sessionId')
            ->andWhere('s.endTime > :now')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->setParameter('now', $now)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countBySession(Uuid $sessionId, \DateTimeImmutable $now): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->innerJoin('b.session', 's')
            ->where('IDENTITY(b.session) = :sessionId')
            ->andWhere('s.endTime > :now')
            ->setParameter('sessionId', $sessionId, UuidType::NAME)
            ->setParameter('now', $now)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return Booking[] */
    public function findByUserPaginated(Uuid $userId, int $page, int $pageSize, \DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('b.userId = :userId')
            ->andWhere('s.endTime > :now')
            ->setParameter('userId', $userId, UuidType::NAME)
            ->setParameter('now', $now)
            ->orderBy('b.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countByUser(Uuid $userId, \DateTimeImmutable $now): int
    {
        return (int) $this->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->innerJoin('b.session', 's')
            ->where('b.userId = :userId')
            ->andWhere('s.endTime > :now')
            ->setParameter('userId', $userId, UuidType::NAME)
            ->setParameter('now', $now)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findWithSession(Uuid $id): ?Booking
    {
        return $this->createQueryBuilder('b')
            ->addSelect('s')
            ->innerJoin('b.session', 's')
            ->where('b.id = :id')
            ->setParameter('id', $id, UuidType::NAME)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
