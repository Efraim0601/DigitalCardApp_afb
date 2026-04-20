FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# -- Runtime stage: dedicated non-root user --
FROM eclipse-temurin:17-jre
WORKDIR /app

# Create a non-privileged user/group and own /app
RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --home-dir /app --shell /sbin/nologin app

COPY --from=build --chown=app:app /app/target/*.jar app.jar

USER app:app

EXPOSE 9999
ENTRYPOINT ["java", "-jar", "app.jar"]
