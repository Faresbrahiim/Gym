# =========================
# Build stage
# =========================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy only project & solution files first (for caching)
COPY user-service/user-service.sln user-service/
COPY user-service/user-service.csproj user-service/
COPY user-service.Application/user-service.Application.csproj user-service.Application/
COPY user-service.Infrastructure/user-service.Infrastructure.csproj user-service.Infrastructure/

# Restore dependencies
RUN dotnet restore user-service/user-service.sln

# Copy everything else
COPY . .

# Publish
RUN dotnet publish user-service/user-service.csproj -c Release -o /app/publish

# =========================
# Runtime stage
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "user-service.dll"]