package com.afriland.cardyo.repository;

import com.afriland.cardyo.entity.Card;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID> {

    Optional<Card> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = {"department", "jobTitle"})
    @Query("SELECT c FROM Card c WHERE LOWER(c.email) = LOWER(:email)")
    Optional<Card> findByEmailWithRelations(@Param("email") String email);

    @EntityGraph(attributePaths = {"department", "jobTitle"})
    @Query("SELECT c FROM Card c")
    Page<Card> findAllWithRelations(Pageable pageable);

    @EntityGraph(attributePaths = {"department", "jobTitle"})
    @Query("""
        SELECT c FROM Card c
        WHERE LOWER(c.email)     LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    Page<Card> search(@Param("q") String q, Pageable pageable);

    boolean existsByEmailIgnoreCase(String email);

    @Modifying
    @Query(value = """
        INSERT INTO cards (id, email, first_name, last_name, company, title,
                           phone, fax, mobile, department_id, job_title_id,
                           created_at, updated_at)
        VALUES (gen_random_uuid(), :email, :firstName, :lastName, :company, :title,
                :phone, :fax, :mobile, :departmentId, :jobTitleId,
                now(), now())
        ON CONFLICT (email) DO UPDATE SET
            first_name    = COALESCE(:firstName,    cards.first_name),
            last_name     = COALESCE(:lastName,     cards.last_name),
            company       = COALESCE(:company,      cards.company),
            title         = COALESCE(:title,        cards.title),
            phone         = :phone,
            fax           = :fax,
            mobile        = COALESCE(:mobile,       cards.mobile),
            department_id = COALESCE(:departmentId, cards.department_id),
            job_title_id  = COALESCE(:jobTitleId,   cards.job_title_id),
            updated_at    = now()
        """, nativeQuery = true)
    void upsertByEmail(@Param("email") String email,
                       @Param("firstName") String firstName,
                       @Param("lastName") String lastName,
                       @Param("company") String company,
                       @Param("title") String title,
                       @Param("phone") String phone,
                       @Param("fax") String fax,
                       @Param("mobile") String mobile,
                       @Param("departmentId") UUID departmentId,
                       @Param("jobTitleId") UUID jobTitleId);

    @Modifying
    @Query("DELETE FROM Card c WHERE c.id IN :ids")
    int bulkDeleteByIds(@Param("ids") List<UUID> ids);

    @Modifying
    @Query("UPDATE Card c SET c.shareCount = c.shareCount + 1 WHERE c.email = :email")
    int incrementShareCount(@Param("email") String email);
}