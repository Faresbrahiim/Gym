# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy everything from microservices root
COPY . .

# Restore using solution inside user-service folder
RUN dotnet restore user-service/user-service.sln

# Publish API project
RUN dotnet publish user-service/user-service.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "user-service.dll"]