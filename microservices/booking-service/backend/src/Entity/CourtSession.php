<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\SessionStatus;
use App\Repository\CourtSessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CourtSessionRepository::class)]
#[ORM\Table(name: 'court_sessions')]
#[ORM\HasLifecycleCallbacks]
class CourtSession
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(type: UuidType::NAME)]
    private Uuid $coachId;

    #[ORM\Column(length: 255)]
    private string $coachFullName;

    #[ORM\Column(length: 500)]
    private string $coachProfilePictureUrl;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column]
    private \DateTimeImmutable $startTime;

    #[ORM\Column]
    private \DateTimeImmutable $endTime;

    #[ORM\Column]
    private int $maxParticipants;

    #[ORM\Column(length: 20, enumType: SessionStatus::class)]
    private SessionStatus $status;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int, Booking> */
    #[ORM\OneToMany(targetEntity: Booking::class, mappedBy: 'session', cascade: ['remove'], orphanRemoval: true)]
    private Collection $bookings;

    public function __construct()
    {
        $this->status    = SessionStatus::OPEN;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->bookings  = new ArrayCollection();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCoachId(): Uuid
    {
        return $this->coachId;
    }

    public function setCoachId(Uuid $coachId): static
    {
        $this->coachId = $coachId;
        return $this;
    }

    public function getCoachFullName(): string
    {
        return $this->coachFullName;
    }

    public function setCoachFullName(string $coachFullName): static
    {
        $this->coachFullName = $coachFullName;
        return $this;
    }

    public function getCoachProfilePictureUrl(): string
    {
        return $this->coachProfilePictureUrl;
    }

    public function setCoachProfilePictureUrl(string $coachProfilePictureUrl): static
    {
        $this->coachProfilePictureUrl = $coachProfilePictureUrl;
        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getStartTime(): \DateTimeImmutable
    {
        return $this->startTime;
    }

    public function setStartTime(\DateTimeImmutable $startTime): static
    {
        $this->startTime = $startTime;
        return $this;
    }

    public function getEndTime(): \DateTimeImmutable
    {
        return $this->endTime;
    }

    public function setEndTime(\DateTimeImmutable $endTime): static
    {
        $this->endTime = $endTime;
        return $this;
    }

    public function getMaxParticipants(): int
    {
        return $this->maxParticipants;
    }

    public function setMaxParticipants(int $maxParticipants): static
    {
        $this->maxParticipants = $maxParticipants;
        return $this;
    }

    public function getStatus(): SessionStatus
    {
        return $this->status;
    }

    public function setStatus(SessionStatus $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /** @return Collection<int, Booking> */
    public function getBookings(): Collection
    {
        return $this->bookings;
    }
}
