using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using user_service.DTOs;
using user_service.Interfaces;

namespace user_service.Services
{
    public class TokenService : ITokenService
    {
        private readonly RSA _privateKey;
        private readonly string _issuer;
        private readonly string _audience;

        public TokenService(string privateKeyPath, string issuer, string audience)
        {
            _issuer = issuer;
            _audience = audience;

            _privateKey = RSA.Create();
            var privateKeyText = System.IO.File.ReadAllText(privateKeyPath);
            _privateKey.ImportFromPem(privateKeyText);
        }

        public string GenerateToken(UserDto user)
        {
            var credentials = new SigningCredentials(
                new RsaSecurityKey(_privateKey),
                SecurityAlgorithms.RsaSha256
            );

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
