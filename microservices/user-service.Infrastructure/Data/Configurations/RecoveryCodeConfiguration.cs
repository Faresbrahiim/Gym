using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Entities;

namespace user_service.Infrastructure.Data.Configurations
{
    public class RecoveryCodeConfiguration : IEntityTypeConfiguration<RecoveryCode>
    {
        public void Configure(EntityTypeBuilder<RecoveryCode> builder)
        {
            builder.ToTable("recovery_codes");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.CodeHash)
                .IsRequired();

            builder.Property(x => x.Used)
                .HasDefaultValue(false);

            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.HasOne(x => x.User)
                .WithMany(u => u.RecoveryCodes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}