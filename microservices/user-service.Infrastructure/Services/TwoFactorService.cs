using OtpNet;
using QRCoder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using user_service.Application.Entities;
using user_service.Application.Interfaces;
using user_service.Helpers;

namespace user_service.Infrastructure.Services
{
    public class TwoFactorService:ITwoFactorService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRecoveryCodeRepository _recoveryCodeRepository;

        public TwoFactorService(IUserRepository userRepository , IRecoveryCodeRepository recoveryCodeRepository)
        {
            _userRepository = userRepository;
            _recoveryCodeRepository = recoveryCodeRepository;
        }

        public async Task<TwoFactorSetupDto> GenerateSetupAsync(Guid userId)
        {
            var user = await _userRepository.GetById(userId);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            var secret = Base32Encoding.ToString(secretBytes);

            var issuer = "GymApp";
            var email = user.Email;

            var uri = $"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}";

            var qrGenerator = new QRCodeGenerator();
            var qrData = qrGenerator.CreateQrCode(uri, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrData);
            var qrBytes = qrCode.GetGraphic(20);

            var qrBase64 = Convert.ToBase64String(qrBytes);

            user.TwoFactorSecret = secret;

            await _userRepository.Update(user);

            return new TwoFactorSetupDto
            {
                QrCodeImage = qrBase64,
                ManualKey = secret
            };
        }

        public async Task<List<string>> ConfirmSetupAsync(Guid userId, string code)
        {
            var user = await _userRepository.GetById(userId);

            if (user == null)
                throw new Exception("User not found");

            if (string.IsNullOrEmpty(user.TwoFactorSecret))
                throw new Exception("2FA setup not initiated");

            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);

            var totp = new Totp(secretBytes);

            bool isValid = totp.VerifyTotp(code, out long timeStepMatched, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
                throw new Exception("Invalid 2FA code");

            user.TwoFactorEnabled = true;
            await _userRepository.Update(user);

            var recoveryCodes = await GenerateAndStoreRecoveryCodes(userId);

            return recoveryCodes;
        }

        

        public async Task<bool> VerifyCodeAsync(User user, string code)
        {
            if (!user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
                return false;

            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);

            var totp = new Totp(secretBytes);

            return  totp.VerifyTotp(
                code,
                out long timeStepMatched,
                VerificationWindow.RfcSpecifiedNetworkDelay
            );
        }

        private List<string> GenerateRecoveryCodes(int count = 10)
        {
            var codes = new List<string>();

            for (int i = 0; i < count; i++)
            {
                var code = RandomNumberGenerator.GetInt32(10000000, 99999999).ToString();
                codes.Add(code);
            }

            return codes;
        }

        public async Task<List<string>> GenerateAndStoreRecoveryCodes(Guid userId)
        {
            var rawCodes = GenerateRecoveryCodes();

            var entities = rawCodes.Select(code => new RecoveryCode
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CodeHash = TokenHelper.HashToken(code),
                CreatedAt = DateTime.UtcNow,
                Used = false
            }).ToList();

            await _recoveryCodeRepository.InvalidateAll(userId);

            await _recoveryCodeRepository.CreateMany(entities);

            return rawCodes;
        }
    }
}
