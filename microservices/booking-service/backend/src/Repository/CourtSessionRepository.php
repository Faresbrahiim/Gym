<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\CourtSession;
use App\Enum\SessionStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<CourtSession>
 */
class CourtSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CourtSession::class);
    }

    public function save(CourtSession $session, bool $flush = true): void
    {
        $this->getEntityManager()->persist($session);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /** @return CourtSession[] */
    public function findOpenPaginated(int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.status = :status')
            ->setParameter('status', SessionStatus::OPEN->value)
            ->orderBy('s.startTime', 'ASC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    /** @return CourtSession[] */
    public function findAllPaginated(int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('s')
            ->addSelect(
                "CASE
                    WHEN s.status = :openStatus THEN 0
                    WHEN s.status = :closedStatus THEN 1
                    ELSE 2
                END AS HIDDEN statusPriority"
            )
            ->setParameter('openStatus', SessionStatus::OPEN->value)
            ->setParameter('closedStatus', SessionStatus::CLOSED->value)
            ->orderBy('statusPriority', 'ASC')
            ->addOrderBy('s.startTime', 'ASC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countOpen(): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->where('s.status = :status')
            ->setParameter('status', SessionStatus::OPEN->value)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countAll(): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /** @return CourtSession[] */
    public function findByCoachPaginated(Uuid $coachId, int $page, int $pageSize): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.coachId = :coachId')
            ->setParameter('coachId', $coachId, UuidType::NAME)
            ->orderBy('s.startTime', 'DESC')
            ->setFirstResult(($page - 1) * $pageSize)
            ->setMaxResults($pageSize)
            ->getQuery()
            ->getResult();
    }

    public function countByCoach(Uuid $coachId): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->where('s.coachId = :coachId')
            ->setParameter('coachId', $coachId, UuidType::NAME)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
