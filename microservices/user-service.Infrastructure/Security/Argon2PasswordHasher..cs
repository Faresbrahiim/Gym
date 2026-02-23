//using Isopoh.Cryptography.Argon2;
//using Konscious.Security.Cryptography;
//using System.Security.Cryptography;
//using System.Text;

//namespace user_service.Security
//{
//    public class Argon2PasswordHasher : IPasswordHasher
//    {
//        private const int SaltSize = 16;      // 128-bit salt
//        private const int HashSize = 32;      // 256-bit hash
//        private const int MemorySize = 65536; // 64 MB
//        private const int Iterations = 3;
//        private const int DegreeOfParallelism = 2;

//        public string Hash(string password)
//        {
//            byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

//            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
//            {
//                Salt = salt,
//                Iterations = Iterations,
//                MemorySize = MemorySize,
//                DegreeOfParallelism = DegreeOfParallelism
//            };

//            byte[] hash = argon2.GetBytes(HashSize);

            
//            return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
//        }

//        public bool Verify(string password, string storedHash)
//        {
//            var parts = storedHash.Split('.');
//            if (parts.Length != 2) return false;

//            byte[] salt = Convert.FromBase64String(parts[0]);
//            byte[] expectedHash = Convert.FromBase64String(parts[1]);

//            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
//            {
//                Salt = salt,
//                Iterations = Iterations,
//                MemorySize = MemorySize,
//                DegreeOfParallelism = DegreeOfParallelism
//            };

//            byte[] actualHash = argon2.GetBytes(HashSize);

//            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
//        }

//        bool NeedsRehash(string storedHash)
//        {
//            return;

//        }

//    }
//}
