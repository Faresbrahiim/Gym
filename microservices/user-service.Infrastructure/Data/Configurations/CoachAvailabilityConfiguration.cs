using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Domain.Entities;

namespace user_service.Infrastructure.Data.Configurations
{
    public class CoachAvailabilityConfiguration : IEntityTypeConfiguration<CoachAvailability>
    {
        public void Configure(EntityTypeBuilder<CoachAvailability> builder)
        {
            builder.ToTable("coach_availability");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.Id)
                .ValueGeneratedOnAdd();

            builder.Property(a => a.DayOfWeek)
                .IsRequired();

            builder.Property(a => a.StartTime)
                .IsRequired();

            builder.Property(a => a.EndTime)
                .IsRequired();

            builder.Property(a => a.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.HasIndex(a => a.CoachId);

            builder.HasCheckConstraint(
                "CK_CoachAvailability_Time",
                "\"StartTime\" < \"EndTime\""
            );

            builder.HasCheckConstraint(
                "CK_CoachAvailability_Day",
                "\"DayOfWeek\" BETWEEN 0 AND 6"
            );

            builder.HasOne(a => a.Coach)
                .WithMany(u => u.CoachAvailabilities)
                .HasForeignKey(a => a.CoachId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    

    }
}
