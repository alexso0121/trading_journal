FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY src/trading_journel_app.csproj src/
RUN dotnet restore src/trading_journel_app.csproj

COPY src/ src/
RUN dotnet publish src/trading_journel_app.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 8080

CMD ["dotnet", "trading_journel_app.dll"]
