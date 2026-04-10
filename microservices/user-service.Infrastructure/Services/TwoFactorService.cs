using OtpNet;
using QRCoder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Domain.Entities;
using user_service.Application.Contracts.Repositories;
using user_service.Application.Contracts.Services;
using user_service.Application.Helpers;

namespace user_service.Infrastructure.Services
{
    public class TwoFactorService : ITwoFactorService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRecoveryCodeRepository _recoveryCodeRepository;

        public TwoFactorService(IUserRepository userRepository, IRecoveryCodeRepository recoveryCodeRepository)
        {
            _userRepository = userRepository;
            _recoveryCodeRepository = recoveryCodeRepository;
        }

        public async Task<TwoFactorSetupDto> GenerateSetupAsync(Guid userId)
        {
            var user = await _userRepository.GetById(userId);

            if (user == null)
                throw new Exception("User not found");

            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            var secret = Base32Encoding.ToString(secretBytes);

            var issuer = "GymApp";
            var uri = $"otpauth://totp/{issuer}:{user.Email}?secret={secret}&issuer={issuer}";

            var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(uri, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrData);
            var qrBase64 = Convert.ToBase64String(qrCode.GetGraphic(20));

            // Persist the secret — insert if first setup, update if reconfiguring
            await _userRepository.UpsertTwoFactor(new UserTwoFactor
            {
                UserId    = user.Id,
                IsEnabled = user.TwoFactor?.IsEnabled ?? false,
                Secret    = secret,
                CreatedAt = user.TwoFactor?.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            return new TwoFactorSetupDto
            {
                QrCodeImage = qrBase64,
                ManualKey   = secret
            };
        }

        public async Task<List<string>> ConfirmSetupAsync(Guid userId, string code)
        {
            var user = await _userRepository.GetById(userId);

            if (user == null)
                throw new Exception("User not found");

            if (user.TwoFactor == null || string.IsNullOrEmpty(user.TwoFactor.Secret))
                throw new Exception("2FA setup not initiated");

            var secretBytes = Base32Encoding.ToBytes(user.TwoFactor.Secret);
            var totp = new Totp(secretBytes);
            bool isValid = totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
                throw new Exception("Invalid 2FA code");

            // Enable 2FA — the secret was already stored in GenerateSetupAsync
            await _userRepository.UpsertTwoFactor(new UserTwoFactor
            {
                UserId    = user.Id,
                IsEnabled = true,
                Secret    = user.TwoFactor.Secret,
                CreatedAt = user.TwoFactor.CreatedAt,
                UpdatedAt = DateTime.UtcNow
            });

            return await GenerateAndStoreRecoveryCodes(userId);
        }

        public async Task<bool> VerifyCodeAsync(User user, string code)
        {
            if (user.TwoFactor == null || !user.TwoFactor.IsEnabled || string.IsNullOrEmpty(user.TwoFactor.Secret))
                return false;

            var secretBytes = Base32Encoding.ToBytes(user.TwoFactor.Secret);
            var totp = new Totp(secretBytes);

            return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
        }

        public async Task<List<string>> GenerateAndStoreRecoveryCodes(Guid userId)
        {
            var rawCodes = GenerateRecoveryCodes();

            var entities = rawCodes.Select(code => new RecoveryCode
            {
                Id        = Guid.NewGuid(),
                UserId    = userId,
                CodeHash  = TokenHelper.HashToken(code),
                CreatedAt = DateTime.UtcNow,
                Used      = false
            }).ToList();

            await _recoveryCodeRepository.InvalidateAll(userId);
            await _recoveryCodeRepository.CreateMany(entities);

            return rawCodes;
        }

        private static List<string> GenerateRecoveryCodes(int count = 10)
        {
            var codes = new List<string>();
            for (int i = 0; i < count; i++)
                codes.Add(RandomNumberGenerator.GetInt32(10000000, 99999999).ToString());
            return codes;
        }
    }
}
