using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using user_service.Application.DTOs;
using user_service.Application.Interfaces;


namespace user_service.Infrastructure.Security
{
    public class TokenService : ITokenService
    {
        private readonly RSA _privateKey;
        private readonly string _issuer;
        private readonly string _audience;

        public TokenService(string privateKeyText, string publicKeyText, string issuer, string audience)
        {
            _issuer = issuer;
            _audience = audience;

            _privateKey = RSA.Create();
            _privateKey.ImportFromPem(privateKeyText.ToCharArray());
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