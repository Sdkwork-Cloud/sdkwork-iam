package com.sdkwork.iam.app.sdk.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.sdkwork.iam.app.sdk.http.HttpClient;
import com.sdkwork.iam.app.sdk.model.*;
import java.util.List;
import java.util.Map;

public class IamApi {
    private final HttpClient client;

    public IamApi(HttpClient client) {
        this.client = client;
    }

    /** Department Assignments list. */
    public AppbaseApiResult departmentAssignmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/department_assignments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments list. */
    public AppbaseApiResult departmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/departments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Departments tree retrieve. */
    public AppbaseApiResult departmentsTreeRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.appPath("/iam/departments/tree"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organization Memberships list. */
    public AppbaseApiResult organizationMembershipsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organization_memberships"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations list. */
    public AppbaseApiResult organizationsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/organizations"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Organizations tree retrieve. */
    public AppbaseApiResult organizationsTreeRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.appPath("/iam/organizations/tree"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Position Assignments list. */
    public AppbaseApiResult positionAssignmentsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/position_assignments"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Positions list. */
    public AppbaseApiResult positionsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/positions"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Role Bindings list. */
    public AppbaseApiResult roleBindingsList(Integer page, Integer pageSize, String cursor, String sort, String q) throws Exception {
        String query = buildQueryString(List.of(
            new QueryParameterSpec("page", page, "form", true, false, null),
            new QueryParameterSpec("page_size", pageSize, "form", true, false, null),
            new QueryParameterSpec("cursor", cursor, "form", true, false, null),
            new QueryParameterSpec("sort", sort, "form", true, false, null),
            new QueryParameterSpec("q", q, "form", true, false, null)
        ));
        Object raw = client.get(ApiPaths.appendQueryString(ApiPaths.appPath("/iam/role_bindings"), query));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current retrieve. */
    public AppbaseApiResult usersCurrentRetrieve() throws Exception {
        Object raw = client.get(ApiPaths.appPath("/iam/users/current"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current update. */
    public AppbaseApiResult usersCurrentUpdate(Map<String, Object> body) throws Exception {
        Object raw = client.patch(ApiPaths.appPath("/iam/users/current"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current email Bindings delete. */
    public AppbaseApiResult usersCurrentEmailBindingsDelete() throws Exception {
        Object raw = client.delete(ApiPaths.appPath("/iam/users/current/email_bindings"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current email Bindings create. */
    public AppbaseApiResult usersCurrentEmailBindingsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.appPath("/iam/users/current/email_bindings"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current password update. */
    public AppbaseApiResult usersCurrentPasswordUpdate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.appPath("/iam/users/current/password"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current phone Bindings delete. */
    public AppbaseApiResult usersCurrentPhoneBindingsDelete() throws Exception {
        Object raw = client.delete(ApiPaths.appPath("/iam/users/current/phone_bindings"));
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }

    /** Users current phone Bindings create. */
    public AppbaseApiResult usersCurrentPhoneBindingsCreate(Map<String, Object> body) throws Exception {
        Object raw = client.post(ApiPaths.appPath("/iam/users/current/phone_bindings"), body, null, null, "application/json");
        return client.convertValue(raw, new TypeReference<AppbaseApiResult>() {});
    }


    private record QueryParameterSpec(String name, Object value, String style, boolean explode, boolean allowReserved, String contentType) {}

    private static String buildQueryString(List<QueryParameterSpec> parameters) throws Exception {
        List<String> pairs = new java.util.ArrayList<>();
        for (QueryParameterSpec parameter : parameters) {
            appendSerializedParameter(pairs, parameter);
        }
        return String.join("&", pairs);
    }

    private static void appendSerializedParameter(List<String> pairs, QueryParameterSpec parameter) throws Exception {
        if (parameter.value() == null) {
            return;
        }
        if (parameter.contentType() != null && !parameter.contentType().isBlank()) {
            String json = clientObjectMapper().writeValueAsString(parameter.value());
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(json, parameter.allowReserved()));
            return;
        }

        String style = parameter.style() == null || parameter.style().isBlank() ? "form" : parameter.style();
        Object value = parameter.value();
        if ("deepObject".equals(style) && value instanceof Map<?, ?> map) {
            appendDeepObjectParameter(pairs, parameter.name(), map, parameter.allowReserved());
        } else if (value instanceof Iterable<?> iterable) {
            appendArrayParameter(pairs, parameter.name(), iterable, style, parameter.explode(), parameter.allowReserved());
        } else if (value instanceof Map<?, ?> map) {
            appendObjectParameter(pairs, parameter.name(), map, style, parameter.explode(), parameter.allowReserved());
        } else {
            pairs.add(urlEncode(parameter.name()) + "=" + encodeQueryValue(String.valueOf(value), parameter.allowReserved()));
        }
    }

    private static void appendArrayParameter(List<String> pairs, String name, Iterable<?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                serialized.add(String.valueOf(item));
            }
        }
        if (serialized.isEmpty()) {
            return;
        }
        if ("form".equals(style) && explode) {
            for (String item : serialized) {
                pairs.add(urlEncode(name) + "=" + encodeQueryValue(item, allowReserved));
            }
            return;
        }
        pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
    }

    private static void appendObjectParameter(List<String> pairs, String name, Map<?, ?> values, String style, boolean explode, boolean allowReserved) {
        List<String> serialized = new java.util.ArrayList<>();
        values.forEach((key, value) -> {
            if (value == null) {
                return;
            }
            if ("form".equals(style) && explode) {
                pairs.add(urlEncode(String.valueOf(key)) + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            } else {
                serialized.add(String.valueOf(key));
                serialized.add(String.valueOf(value));
            }
        });
        if (!serialized.isEmpty()) {
            pairs.add(urlEncode(name) + "=" + encodeQueryValue(String.join(",", serialized), allowReserved));
        }
    }

    private static void appendDeepObjectParameter(List<String> pairs, String name, Map<?, ?> values, boolean allowReserved) {
        values.forEach((key, value) -> {
            if (value != null) {
                pairs.add(urlEncode(name + "[" + key + "]") + "=" + encodeQueryValue(String.valueOf(value), allowReserved));
            }
        });
    }

    private static String encodeQueryValue(String value, boolean allowReserved) {
        String encoded = urlEncode(value);
        if (!allowReserved) {
            return encoded;
        }
        return encoded
            .replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%23", "#")
            .replace("%5B", "[").replace("%5D", "]").replace("%40", "@").replace("%21", "!")
            .replace("%24", "$").replace("%26", "&").replace("%27", "'").replace("%28", "(")
            .replace("%29", ")").replace("%2A", "*").replace("%2B", "+").replace("%2C", ",")
            .replace("%3B", ";").replace("%3D", "=");
    }

    private static com.fasterxml.jackson.databind.ObjectMapper clientObjectMapper() {
        return new com.fasterxml.jackson.databind.ObjectMapper();
    }


    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
