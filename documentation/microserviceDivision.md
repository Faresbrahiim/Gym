# microservice devision 
## 1 old division 
    ai-service
    api-gateway
    auth-service
    chat-service
    coach-service
    interaction-service
    member-service
    payment-service
    profile-service stats-service
## 2 new division
User-service
    Handles authentication (login/signup), user profile, membership/subscription, and preferences.
AI-service
    Handles all AI logic: analyzing user body stats, generating exercise/meal recommendations, detecting weaknesses.
Coach-service
    Manages coach profiles, schedules, availability, and interactions with members.
Chat-service
    Handles messaging between members and coaches, notifications, and communication-related features.
Interaction-service
    Tracks user interactions: feedback, likes, comments, engagement with AI recommendations.
Stats-service
    Aggregates user stats, progress reports, analytics, and metrics.
Payment-service
    Manages subscription payments, billing, invoices, and payment history.
API Gateway
    Routes requests, handles auth tokens, load balancing, and acts as the single entry point to the system.
## 3 Why we changed the original division
merged Auth-service and Profile-service into User-service because all these features belong to the same “user domain,” keeping the service cohesive and respecting single responsibility. Other services like AI, Chat, Coach, Payment, Stats, and Interaction remain separate because they handle distinct domains. This simplifies the architecture while keeping it realistic and maintainable.
## why One repository (monorepo) and not each service have own repo
    Easier to manage for a small team/project.
    One place for CI/CD, issues, and version control.
    Easier to coordinate changes that affect multiple services.
### like for example  steps to code .net on microservice user 
    1 clone repo 
    2 cd -> to service 
    3 run -> dotnet run --project UserService.API/UserService.API.csproj
    
```
Gym Member:
Register / Sign Up
Login / Logout
Reset Passwor
View Profile
Update Profile (name, age, preferences, goals)
View Membership / Subscription
Upgrade / Cancel Membership
View Activity / Progress
Coach:
Login / Logout
Update Own Profile
View Assigned Members’ Info (read-only, permission-controlled)
Admin:
Add New Coach
Remove User / Coach
Manage Memberships
Reset User Password
```