# UML Diagrams – Gym Application

Tous les diagrammes sont au format **PlantUML** (`.puml`).  
Pour les visualiser, utilisez l'un des outils suivants :
- [PlantUML Online](https://www.plantuml.com/plantuml/uml/)
- Extension VSCode **PlantUML** (jebbs.plantuml)
- IntelliJ IDEA Plugin PlantUML Integration

---

## Architecture : 4 Microservices

| # | Microservice | Technologie | Rôle |
|---|---|---|---|
| 1 | **user-service** | C# / .NET 8 | Authentification, profils, 2FA |
| 2 | **membership-service** | Java / Spring Boot | Plans, Abonnements |
| 3 | **payment-service** | Java / Spring Boot | Paiements (Stripe) |
| 4 | **cart-service** | PHP / Symfony | Panier, Produits, Commandes |

---

## Fichiers

| Fichier | Type | Description |
|---|---|---|
| `01-use-case.puml` | **Use Case** | Tous les acteurs et cas d'utilisation des 4 microservices |
| `02-class-user-service.puml` | **Classe** | Diagramme de classes du user-service (MVC) |
| `03-class-membership-service.puml` | **Classe** | Diagramme de classes du membership-service (MVC) |
| `04-class-payment-service.puml` | **Classe** | Diagramme de classes du payment-service (MVC/Hexagonale) |
| `05-class-cart-service.puml` | **Classe** | Diagramme de classes du cart-service (MVC/Symfony) |
| `06-sequence-user-registration-login.puml` | **Séquence** | Inscription, vérification email et connexion |
| `07-sequence-subscription-payment.puml` | **Séquence** | Souscription à un plan + paiement + activation via Kafka |
| `08-sequence-cart-checkout-payment.puml` | **Séquence** | Panier → Checkout → Paiement commande → Confirmation |

---

## Patron MVC appliqué

Chaque microservice respecte une architecture en **3 couches** :

```
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER (API Layer)                                     │
│  Reçoit les requêtes HTTP, délègue au Service               │
├─────────────────────────────────────────────────────────────┤
│  SERVICE (Application Layer)                                │
│  Logique métier, orchestration, publication d'événements    │
├─────────────────────────────────────────────────────────────┤
│  MODEL (Domain / Entities)                                  │
│  Entités, valeurs, énumérations, invariants métier          │
└─────────────────────────────────────────────────────────────┘
```

La communication **inter-microservices** se fait via **Kafka** (événements asynchrones) pour les flux critiques (paiement → abonnement, paiement → commande) et via **HTTP REST** pour les requêtes synchrones.
