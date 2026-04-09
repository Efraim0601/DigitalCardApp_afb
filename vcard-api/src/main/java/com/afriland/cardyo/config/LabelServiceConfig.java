package com.afriland.cardyo.config;

import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.repository.DepartmentRepository;
import com.afriland.cardyo.repository.JobTitleRepository;
import com.afriland.cardyo.service.LabelCacheService;
import com.afriland.cardyo.service.LabelService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LabelServiceConfig {

    @Bean
    public LabelService<Department> departmentLabelService(DepartmentRepository repo,
                                                           LabelCacheService cache) {
        return new LabelService<>(repo, Department::new, "departments", cache);
    }

    @Bean
    public LabelService<JobTitle> jobTitleLabelService(JobTitleRepository repo,
                                                       LabelCacheService cache) {
        return new LabelService<>(repo, JobTitle::new, "job_titles", cache);
    }
}
