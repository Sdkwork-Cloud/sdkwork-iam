const String iamPlatformOrganizationId = '0';

bool isIamPlatformOrganizationId(String value) {
  return value.trim() == iamPlatformOrganizationId;
}

bool isIamLoginEligibleOrganizationId(String value) {
  final normalized = value.trim();
  return normalized.isNotEmpty && !isIamPlatformOrganizationId(normalized);
}

Map<String, String> buildPersonalLoginContextSelectionBody(String continuationToken) {
  return {
    'continuationToken': continuationToken.trim(),
    'loginScope': 'TENANT',
    'organizationId': iamPlatformOrganizationId,
  };
}

Map<String, String> buildOrganizationLoginContextSelectionBody(
  String continuationToken,
  String organizationId,
) {
  final normalizedOrganizationId = organizationId.trim();
  if (!isIamLoginEligibleOrganizationId(normalizedOrganizationId)) {
    throw ArgumentError('organization id is required for organization login');
  }

  return {
    'continuationToken': continuationToken.trim(),
    'loginScope': 'ORGANIZATION',
    'organizationId': normalizedOrganizationId,
  };
}

class IamLoginContextOrganizationChoice {
  const IamLoginContextOrganizationChoice({
    required this.organizationId,
    this.displayName,
    this.name,
  });

  final String organizationId;
  final String? displayName;
  final String? name;
}

class IamLoginContextSelectionChallenge {
  const IamLoginContextSelectionChallenge({
    required this.challengeType,
    required this.continuationToken,
    required this.organizations,
    this.personalDisplayName,
  });

  final String challengeType;
  final String continuationToken;
  final List<IamLoginContextOrganizationChoice> organizations;
  final String? personalDisplayName;
}

IamLoginContextSelectionChallenge? parseIamLoginContextSelectionChallenge(
  Map<String, dynamic> payload,
) {
  final challengeType = _optionalString(payload['challengeType']);
  if (challengeType != 'LOGIN_CONTEXT_SELECTION' &&
      challengeType != 'ORGANIZATION_SELECTION') {
    return null;
  }

  final continuationToken = _optionalString(payload['continuationToken']);
  if (continuationToken == null) {
    return null;
  }

  final organizations = <IamLoginContextOrganizationChoice>[];
  final rawOrganizations = payload['organizations'];
  if (rawOrganizations is List) {
    for (final item in rawOrganizations) {
      if (item is! Map) {
        continue;
      }

      final organizationId = _optionalString(item['organizationId']) ??
          _optionalString(item['organization_id']) ??
          _optionalString(item['id']);
      if (organizationId == null || !isIamLoginEligibleOrganizationId(organizationId)) {
        continue;
      }

      organizations.add(
        IamLoginContextOrganizationChoice(
          organizationId: organizationId,
          displayName: _optionalString(item['displayName']) ??
              _optionalString(item['display_name']),
          name: _optionalString(item['name']),
        ),
      );
    }
  }

  String? personalDisplayName;
  final rawOptions = payload['options'];
  if (rawOptions is List) {
    for (final item in rawOptions) {
      if (item is! Map) {
        continue;
      }

      final loginScope = _optionalString(item['loginScope']) ??
          _optionalString(item['login_scope']);
      if (loginScope == 'TENANT') {
        personalDisplayName = _optionalString(item['displayName']) ??
            _optionalString(item['display_name']);
        break;
      }
    }
  }

  return IamLoginContextSelectionChallenge(
    challengeType: challengeType!,
    continuationToken: continuationToken,
    organizations: organizations,
    personalDisplayName: personalDisplayName,
  );
}

bool isIamLoginContextSelectionPayload(Map<String, dynamic> payload) {
  return parseIamLoginContextSelectionChallenge(payload) != null;
}

String? _optionalString(Object? value) {
  if (value == null) {
    return null;
  }

  final normalized = value.toString().trim();
  return normalized.isEmpty ? null : normalized;
}
