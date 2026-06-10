package com.afriland.approval.service;

import com.afriland.approval.model.CardRequest;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class VCardApiService {

    @Value("${vcard.api.base:http://localhost:8767}")
    private String apiBase;

    @Value("${vcard.api.email:admin@afrilandfirstbank.com}")
    private String apiEmail;

    @Value("${vcard.api.password:admin}")
    private String apiPassword;

    @Value("${vcard.front.url:http://localhost:8766}")
    private String frontUrl;

    public String getFrontUrl() { return frontUrl; }

    public Map<String, Object> sendToVCardApp(CardRequest req) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                    .build();

            // 1. Get XSRF token
            HttpRequest getReq = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase + "/api/public/cards")).GET().build();
            client.send(getReq, HttpResponse.BodyHandlers.ofString());

            CookieManager cm = (CookieManager) client.cookieHandler().orElse(null);
            String xsrf = "";
            if (cm != null) {
                for (HttpCookie cookie : cm.getCookieStore().getCookies()) {
                    if ("XSRF-TOKEN".equalsIgnoreCase(cookie.getName())) {
                        xsrf = cookie.getValue(); break;
                    }
                }
            }

            // 2. Login
            String loginBody = "{\"email\":\"" + apiEmail + "\",\"password\":\"" + apiPassword + "\"}";
            HttpRequest loginReq = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase + "/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .header("X-XSRF-TOKEN", xsrf)
                    .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                    .build();
            HttpResponse<String> loginRes = client.send(loginReq, HttpResponse.BodyHandlers.ofString());

            if (loginRes.statusCode() >= 400)
                return Map.of("success", false, "message", "vCard login failed: " + loginRes.statusCode());

            // Refresh XSRF after login
            if (cm != null) {
                for (HttpCookie cookie : cm.getCookieStore().getCookies()) {
                    if ("XSRF-TOKEN".equalsIgnoreCase(cookie.getName())) {
                        xsrf = cookie.getValue(); break;
                    }
                }
            }

            // 3. Build Excel
            byte[] excelBytes = buildExcel(req);

            // 4. Upload as multipart
            String boundary = "----FormBoundary" + UUID.randomUUID().toString().replace("-", "");
            byte[] body = buildMultipart(boundary, "file", "card.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

            HttpRequest uploadReq = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase + "/api/data-import"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .header("X-XSRF-TOKEN", xsrf)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            HttpResponse<String> uploadRes = client.send(uploadReq, HttpResponse.BodyHandlers.ofString());

            boolean ok = uploadRes.statusCode() < 400;
            return Map.of("success", ok,
                    "message", ok ? "Card sent to DigitalCardApp." : "Upload failed: " + uploadRes.body(),
                    "cardUrl", frontUrl + "/#/?email=" + req.getEmail());
        } catch (Exception e) {
            return Map.of("success", false, "message", "vCard API error: " + e.getMessage());
        }
    }

    public byte[] buildExcel(CardRequest req) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet ws = wb.createSheet("Cartes");
            String[] headers = {"email", "first_name", "last_name", "company", "title",
                    "phone", "fax", "mobile", "department_fr", "department_en",
                    "job_title_fr", "job_title_en"};
            Row hr = ws.createRow(0);
            CellStyle bold = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            bold.setFont(font);
            for (int i = 0; i < headers.length; i++) {
                Cell c = hr.createCell(i);
                c.setCellValue(headers[i]);
                c.setCellStyle(bold);
            }
            Row dr = ws.createRow(1);
            dr.createCell(0).setCellValue(req.getEmail());
            dr.createCell(1).setCellValue(req.getFirstName());
            dr.createCell(2).setCellValue(req.getLastName());
            dr.createCell(3).setCellValue("Afriland First Bank");
            dr.createCell(4).setCellValue(req.getTitle() != null && !req.getTitle().isEmpty() ? req.getTitle() : req.getJobTitleFr());
            dr.createCell(5).setCellValue(req.getPhone() != null ? req.getPhone() : "");
            dr.createCell(6).setCellValue(req.getFax() != null ? req.getFax() : "");
            dr.createCell(7).setCellValue(req.getMobile());
            dr.createCell(8).setCellValue(req.getDepartmentFr());
            dr.createCell(9).setCellValue(req.getDepartmentEn());
            dr.createCell(10).setCellValue(req.getJobTitleFr());
            dr.createCell(11).setCellValue(req.getJobTitleEn());

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }

    private byte[] buildMultipart(String boundary, String fieldName, String filename, String contentType, byte[] data) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        String nl = "\r\n";
        out.write(("--" + boundary + nl).getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + fieldName + "\"; filename=\"" + filename + "\"" + nl).getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + contentType + nl + nl).getBytes(StandardCharsets.UTF_8));
        out.write(data);
        out.write((nl + "--" + boundary + "--" + nl).getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }
}
