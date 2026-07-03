import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment values synced with backend/supabase/.env.example
class EnvConfig {
  static String get supabaseUrl => _require('SUPABASE_URL');
  static String get supabaseAnonKey => _require('SUPABASE_ANON_KEY');

  static String? get veryfiClientId => dotenv.env['VERYFI_CLIENT_ID'];
  static String? get veryfiUsername => dotenv.env['VERYFI_USERNAME'];
  static String? get veryfiApiKey => dotenv.env['VERYFI_API_KEY'];
  static String? get googleMapsApiKey => dotenv.env['GOOGLE_MAPS_API_KEY'];

  static String _require(String key) {
    final value = dotenv.env[key];
    if (value == null || value.isEmpty) {
      throw StateError('Missing $key in apps/mobile/.env');
    }
    return value;
  }
}
