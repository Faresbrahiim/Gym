using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Entities;

namespace user_service.Infrastructure.Data.Configurations

{
    public class MemberProfileConfiguration : IEntityTypeConfiguration<MemberProfile>
    {
        public void Configure(EntityTypeBuilder<MemberProfile> builder)
        {
            builder.ToTable("member_profiles");

            builder.HasKey(p => p.UserId);

            builder.Property(p => p.Gender)
                .HasMaxLength(20);

            builder.Property(p => p.FitnessGoal)
                .HasMaxLength(255);

            builder.Property(p => p.ExperienceLevel)
                .HasConversion<int>();

            builder.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.Property(p => p.UpdatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            
            builder.HasCheckConstraint("CK_MemberProfile_Height", "\"HeightCm\" > 0");
            builder.HasCheckConstraint("CK_MemberProfile_Weight", "\"WeightKg\" > 0");

            builder.HasOne(p => p.User)
                .WithOne(u => u.MemberProfile)
                .HasForeignKey<MemberProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
