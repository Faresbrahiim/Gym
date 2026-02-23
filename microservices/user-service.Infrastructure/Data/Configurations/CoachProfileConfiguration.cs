using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Entities;

namespace user_service.Infrastructure.Data.Configurations

{
    public class CoachProfileConfiguration : IEntityTypeConfiguration<CoachProfile>
    {
        public void Configure(EntityTypeBuilder<CoachProfile> builder)
        {
            builder.ToTable("coach_profiles");

            builder.HasKey(p => p.UserId);

            builder.Property(p => p.Language)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.Property(p => p.UpdatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.HasCheckConstraint("CK_CoachProfile_Experience", "\"YearsOfExperience\" >= 0");

            builder.HasOne(p => p.User)
                .WithOne(u => u.CoachProfile)
                .HasForeignKey<CoachProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
