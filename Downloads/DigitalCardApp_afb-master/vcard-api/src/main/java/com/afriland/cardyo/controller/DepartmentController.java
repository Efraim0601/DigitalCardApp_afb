package com.afriland.cardyo.controller;

import com.afriland.cardyo.entity.Department;
import com.afriland.cardyo.service.LabelService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController extends AbstractLabelController<Department> {

    public DepartmentController(
            @Qualifier("departmentLabelService") LabelService<Department> labelService) {
        super(labelService);
    }
}
