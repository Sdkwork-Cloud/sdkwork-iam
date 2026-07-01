import 'package:sdkwork_iam_flutter_mobile_core/sdkwork_iam_flutter_mobile_core.dart';

class IamFlutterMobileAccountBindingPolicy {
  const IamFlutterMobileAccountBindingPolicy({
    required this.contactBindingEnabled,
    required this.emailBindingEnabled,
    required this.oauthSelfServiceLinkEnabled,
  });

  final bool contactBindingEnabled;
  final bool emailBindingEnabled;
  final bool oauthSelfServiceLinkEnabled;
}

class IamFlutterMobileOAuthAccountLink {
  const IamFlutterMobileOAuthAccountLink({
    required this.accountLinkId,
    this.provider,
  });

  final String accountLinkId;
  final String? provider;
}

typedef IamFlutterMobileAccountBindingPolicyRetriever = Future<Map<String, dynamic>> Function();

typedef IamFlutterMobileOAuthAccountLinkLister = Future<List<Map<String, dynamic>>> Function();

/// Framework-independent account binding controller for Flutter host apps.
class IamFlutterMobileAccountBindingController {
  IamFlutterMobileAccountBindingController({
    required IamFlutterMobileAccountBindingPolicyRetriever retrievePolicy,
    required IamFlutterMobileOAuthAccountLinkLister listAccountLinks,
  })  : _retrievePolicy = retrievePolicy,
        _listAccountLinks = listAccountLinks;

  final IamFlutterMobileAccountBindingPolicyRetriever _retrievePolicy;
  final IamFlutterMobileOAuthAccountLinkLister _listAccountLinks;

  IamFlutterMobileAccountBindingPolicy? _policy;
  List<IamFlutterMobileOAuthAccountLink> _accountLinks = const [];

  IamFlutterMobileAccountBindingPolicy? get policy => _policy;
  List<IamFlutterMobileOAuthAccountLink> get accountLinks => _accountLinks;

  Future<IamFlutterMobileAccountBindingPolicy> loadPolicy() async {
    final payload = await _retrievePolicy();
    final contactBinding = _toRecord(payload['contactBinding'] ?? payload['contact_binding']);
    final oauthBinding = _toRecord(payload['oauthBinding'] ?? payload['oauth_binding']);
    _policy = IamFlutterMobileAccountBindingPolicy(
      contactBindingEnabled: _readBoolean(contactBinding['enabled'], true),
      emailBindingEnabled: _readBoolean(contactBinding['emailEnabled'] ?? contactBinding['email_enabled'], true),
      oauthSelfServiceLinkEnabled: _readBoolean(
        oauthBinding['selfServiceLinkEnabled'] ?? oauthBinding['self_service_link_enabled'],
        false,
      ),
    );
    return _policy!;
  }

  Future<List<IamFlutterMobileOAuthAccountLink>> loadAccountLinks() async {
    final items = await _listAccountLinks();
    _accountLinks = items
        .map((item) {
          final accountLinkId = _optionalString(item['accountLinkId'] ?? item['account_link_id'] ?? item['id']);
          if (accountLinkId == null) {
            return null;
          }
          return IamFlutterMobileOAuthAccountLink(
            accountLinkId: accountLinkId,
            provider: _optionalString(item['provider']),
          );
        })
        .whereType<IamFlutterMobileOAuthAccountLink>()
        .toList(growable: false);
    return _accountLinks;
  }

  static Map<String, dynamic> _toRecord(Object? value) {
    if (value is Map<String, dynamic>) {
      return value;
    }
    if (value is Map) {
      return value.map((key, entryValue) => MapEntry(key.toString(), entryValue));
    }
    return const {};
  }

  static bool _readBoolean(Object? value, bool fallback) {
    if (value is bool) {
      return value;
    }
    if (value is String) {
      final normalized = sdkworkNormalizeLowercase(value);
      if (normalized == 'true' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == '0') {
        return false;
      }
    }
    return fallback;
  }

  static String? _optionalString(Object? value) => sdkworkNormalizeOptionalString(value);
}
