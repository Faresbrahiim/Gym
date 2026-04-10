using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using user_service.Application.DTOs;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Domain.Authorization;


namespace user_service.Infrastructure.Auth
{
    public class TokenService : ITokenService
    {
        private readonly RSA _privateKey;
        private readonly string _issuer;
        private readonly string _audience;

        public TokenService(
            string privateKeyText,
            string publicKeyText,
            string issuer,
            string audience)
        {
            _issuer = issuer;
            _audience = audience;

            _privateKey = RSA.Create();
            _privateKey.ImportFromPem(privateKeyText.ToCharArray());
        }

        // Immediate Session Invalidation — JTI Blacklist  author: Anas
        public TokenResult GenerateToken(UserDto user)
        {
            var permissions = RolePermissionMapping.GetPermissions(user.Role);
           var securityKey = new RsaSecurityKey(_privateKey)
            {
                KeyId = "gym-auth-key-1"
            };

            var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.RsaSha256
            );

            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            var jti = Guid.NewGuid().ToString();
            var expiresAt = DateTime.UtcNow.AddHours(1);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", user.Role.ToString()),
                // Immediate Session Invalidation — JTI Blacklist  author: Anas
                new Claim(JwtRegisteredClaimNames.Jti, jti)
            };

            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission));
            }

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            // Immediate Session Invalidation — JTI Blacklist  author: Anas
            return new TokenResult(
                new JwtSecurityTokenHandler().WriteToken(token),
                jti,
                expiresAt
            );
        }
    }
}
