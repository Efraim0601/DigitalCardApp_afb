package com.afriland.cardyo.controller;

import com.afriland.cardyo.entity.JobTitle;
import com.afriland.cardyo.service.LabelService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/job-titles")
public class JobTitleController extends AbstractLabelController<JobTitle> {

    public JobTitleController(
            @Qualifier("jobTitleLabelService") LabelService<JobTitle> labelService) {
        super(labelService);
    }
}
