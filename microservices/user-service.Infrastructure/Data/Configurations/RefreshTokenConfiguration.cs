using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Domain.Entities;

namespace user_service.Infrastructure.Data.Configurations

{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.ToTable("refresh_tokens");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Id)
                .ValueGeneratedOnAdd();

            builder.Property(t => t.TokenHash)
                .IsRequired();

            builder.Property(t => t.ExpiresAt)
                .IsRequired();

            builder.Property(t => t.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.Property(t => t.UserAgent)
                .HasMaxLength(255);

            builder.Property(t => t.IpAddress)
                .HasMaxLength(45);

            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            builder.Property(t => t.AccessTokenJti)
                .HasMaxLength(36);

            builder.Property(t => t.AccessTokenExpiresAt);

            builder.HasIndex(t => t.UserId);
            builder.HasIndex(t => t.TokenHash);
            builder.HasIndex(t => t.ExpiresAt);

            builder.HasOne(t => t.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    

    }
}
