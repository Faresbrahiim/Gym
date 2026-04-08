// Immediate Session Invalidation — JTI Blacklist  author: Anas
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Application.Domain.Entities;

namespace user_service.Infrastructure.Data.Configurations
{
    public class RevokedTokenConfiguration : IEntityTypeConfiguration<RevokedToken>
    {
        public void Configure(EntityTypeBuilder<RevokedToken> builder)
        {
            builder.ToTable("revoked_tokens");

            builder.HasKey(t => t.Jti);

            builder.Property(t => t.Jti)
                .HasMaxLength(36)
                .IsRequired();

            builder.Property(t => t.ExpiresAt)
                .IsRequired();

            builder.HasIndex(t => t.ExpiresAt);
        }
    }
}
