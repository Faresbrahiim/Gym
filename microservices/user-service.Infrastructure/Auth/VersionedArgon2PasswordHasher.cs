using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using System.Text;

namespace user_service.Infrastructure.Auth
{
    public class VersionedArgon2PasswordHasher : IPasswordHasher
    {
        private const int SaltSize = 16;
        private const int HashSize = 32;

        
        private const int CurrentMemorySize = 65536;
        private const int CurrentIterations = 3;
        private const int CurrentParallelism = 2;
        private const int Version = 19;

        public string Hash(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                MemorySize = CurrentMemorySize,
                Iterations = CurrentIterations,
                DegreeOfParallelism = CurrentParallelism
            };

            byte[] hash = argon2.GetBytes(HashSize);

            var saltBase64 = Convert.ToBase64String(salt);
            var hashBase64 = Convert.ToBase64String(hash);

            return $"$argon2id$v={Version}$m={CurrentMemorySize},t={CurrentIterations},p={CurrentParallelism}${saltBase64}${hashBase64}";
        }

        public bool Verify(string password, string storedHash)
        {
            if (string.IsNullOrWhiteSpace(storedHash))
                return false;

            var parts = storedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length != 5)
                return false;

            var algorithm = parts[0];
            var versionPart = parts[1];
            var paramPart = parts[2];
            var saltBase64 = parts[3];
            var hashBase64 = parts[4];

            if (algorithm != "argon2id")
                return false;

            var paramValues = paramPart.Split(',');

            int memory = int.Parse(paramValues[0].Split('=')[1]);
            int iterations = int.Parse(paramValues[1].Split('=')[1]);
            int parallelism = int.Parse(paramValues[2].Split('=')[1]);

            byte[] salt = Convert.FromBase64String(saltBase64);
            byte[] expectedHash = Convert.FromBase64String(hashBase64);

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                MemorySize = memory,
                Iterations = iterations,
                DegreeOfParallelism = parallelism
            };

            byte[] actualHash = argon2.GetBytes(expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        public bool NeedsRehash(string storedHash)
        {
            var parts = storedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length != 5)
                return true;

            var paramPart = parts[2];
            var paramValues = paramPart.Split(',');

            int memory = int.Parse(paramValues[0].Split('=')[1]);
            int iterations = int.Parse(paramValues[1].Split('=')[1]);
            int parallelism = int.Parse(paramValues[2].Split('=')[1]);

            return memory < CurrentMemorySize
                || iterations < CurrentIterations
                || parallelism < CurrentParallelism;
        }
    }
}