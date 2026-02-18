using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using user_service.Models;
using user_service.Domain.Enums;

namespace user_service.Data.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("users");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Id)
                .ValueGeneratedOnAdd();

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.PasswordHash)
                .IsRequired();

            
            builder.Property(u => u.Role)
                
                .IsRequired();

            builder.Property(u => u.Status)
                
                .HasDefaultValue(UserStatus.PENDING)
                .IsRequired();

            builder.Property(u => u.CreatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.Property(u => u.UpdatedAt)
                .HasDefaultValueSql("NOW()")
                .IsRequired();

            builder.HasIndex(u => u.Role);
            builder.HasIndex(u => u.Status);
        }
    }
}
