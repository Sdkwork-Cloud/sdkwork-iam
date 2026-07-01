/// String helpers aligned with `@sdkwork/utils` / `sdkwork-utils-rust` semantics.
library;

bool sdkworkIsBlank(String? value) {
  return value == null || value.trim().isEmpty;
}

String sdkworkTrim(String value) {
  return value.trim();
}

String? sdkworkNormalizeOptionalString(Object? value) {
  if (value == null) {
    return null;
  }
  final normalized = value.toString().trim();
  return normalized.isEmpty ? null : normalized;
}

String sdkworkNormalizeLowercase(String value) {
  return value.trim().toLowerCase();
}
