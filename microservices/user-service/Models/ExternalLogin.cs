namespace user_service.Models
{
    public class ExternalLogin
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;


        public string Provider { get; set; } = null!;
        
        public string ProviderUserId { get; set; } = null!;
        

        public DateTime CreatedAt { get; set; }
    }
}

