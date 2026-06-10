package com.afriland.cardyo.repository;

import com.afriland.cardyo.entity.LabelEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@NoRepositoryBean
public interface LabelEntityRepository<T extends LabelEntity> extends JpaRepository<T, UUID> {

    @Query("""
        SELECT e FROM #{#entityName} e
        WHERE LOWER(e.labelFr) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(e.labelEn) LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    Page<T> search(@Param("q") String q, Pageable pageable);

    Optional<T> findByLabelFrIgnoreCase(String labelFr);

    Optional<T> findByLabelEnIgnoreCase(String labelEn);
}
