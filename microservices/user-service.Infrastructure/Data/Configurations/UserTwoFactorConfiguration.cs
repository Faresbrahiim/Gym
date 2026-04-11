using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Domain.Entities;

namespace user_service.Infrastructure.Data.Configurations
{
    public class UserTwoFactorConfiguration : IEntityTypeConfiguration<UserTwoFactor>
    {
        public void Configure(EntityTypeBuilder<UserTwoFactor> builder)
        {
            builder.ToTable("user_two_factor");

            builder.HasKey(t => t.UserId);

            builder.Property(t => t.UserId)
                .ValueGeneratedNever();

            builder.Property(t => t.IsEnabled)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(t => t.Secret)
                .HasMaxLength(200);

            builder.Property(t => t.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.Property(t => t.UpdatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.HasOne(t => t.User)
                .WithOne(u => u.TwoFactor)
                .HasForeignKey<UserTwoFactor>(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
