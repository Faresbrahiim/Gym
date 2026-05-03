using System.ComponentModel.DataAnnotations;

namespace user_service.Application.Validation
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public sealed class DateNotInFutureAttribute : ValidationAttribute
    {
        private const int MinAge = 13;
        private const int MaxAge = 120;

        public DateNotInFutureAttribute()
        {
            ErrorMessage = "Please enter a valid date of birth.";
        }

        public override bool IsValid(object? value)
        {
            if (value is null)
                return true;

            if (value is not DateTime dateTime)
                return false;

            var date = dateTime.Date;
            var today = DateTime.Today;

            if (date > today)
                return false;

            if (date > today.AddYears(-MinAge))
                return false;

            if (date < today.AddYears(-MaxAge))
                return false;

            return true;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is null)
                return ValidationResult.Success;

            if (value is not DateTime dateTime)
                return new ValidationResult("Invalid date format.");

            var date = dateTime.Date;
            var today = DateTime.Today;

            if (date > today)
                return new ValidationResult("Date of birth cannot be in the future.");

            if (date > today.AddYears(-MinAge))
                return new ValidationResult($"You must be at least {MinAge} years old.");

            if (date < today.AddYears(-MaxAge))
                return new ValidationResult("Please enter a valid date of birth.");

            return ValidationResult.Success;
        }
    }
}
