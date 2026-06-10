# Execution avec Docker

Cette configuration lance toute l'application:

- Frontend Angular (Nginx): http://localhost:4200
- Backend Spring Boot: http://localhost:8766
- Swagger UI: http://localhost:4200/swagger-ui/index.html
- PostgreSQL: localhost:5455

## Prerequis

- Docker
- Docker Compose (plugin `docker compose`)

## Lancer l'application complete

Depuis la racine du projet:

```bash
docker compose up --build -d
```

Verifier les logs:

```bash
docker compose logs -f
```

## Arreter

```bash
docker compose down
```

Pour supprimer aussi le volume Postgres:

```bash
docker compose down -v
```
