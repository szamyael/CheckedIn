import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';

/// Signs the student out after configured inactivity (from system_settings).
class SessionTimeoutService {
  SessionTimeoutService._();
  static final SessionTimeoutService instance = SessionTimeoutService._();

  Timer? _timer;
  Duration _timeout = const Duration(hours: 8);
  bool _enabled = false;

  Duration get timeout => _timeout;

  Future<void> loadSettings() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      _enabled = false;
      return;
    }

    try {
      final row = await Supabase.instance.client
          .from('system_settings')
          .select('session_timeout_minutes')
          .eq('id', 1)
          .maybeSingle();

      final minutes = row?['session_timeout_minutes'] as int? ?? 480;
      _timeout = Duration(minutes: minutes.clamp(15, 1440));
      _enabled = true;
    } catch (_) {
      _enabled = true;
      _timeout = const Duration(hours: 8);
    }
  }

  void resetTimer() {
    _timer?.cancel();
    if (!_enabled || Supabase.instance.client.auth.currentUser == null) return;

    _timer = Timer(_timeout, () async {
      await AuthService.instance.signOut();
    });
  }

  void stop() {
    _timer?.cancel();
    _enabled = false;
  }
}

/// Wraps the app and resets the inactivity timer on user interaction.
class SessionActivityWrapper extends StatefulWidget {
  final Widget child;

  const SessionActivityWrapper({super.key, required this.child});

  @override
  State<SessionActivityWrapper> createState() => _SessionActivityWrapperState();
}

class _SessionActivityWrapperState extends State<SessionActivityWrapper> {
  final _session = SessionTimeoutService.instance;

  @override
  void initState() {
    super.initState();
    _init();
    AuthService.instance.addListener(_onAuthChange);
  }

  Future<void> _init() async {
    await _session.loadSettings();
    _session.resetTimer();
  }

  void _onAuthChange() {
    if (Supabase.instance.client.auth.currentUser != null) {
      _session.loadSettings().then((_) => _session.resetTimer());
    } else {
      _session.stop();
    }
  }

  @override
  void dispose() {
    AuthService.instance.removeListener(_onAuthChange);
    _session.stop();
    super.dispose();
  }

  void _onActivity() => _session.resetTimer();

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => _onActivity(),
      onPointerMove: (_) => _onActivity(),
      onPointerUp: (_) => _onActivity(),
      child: widget.child,
    );
  }
}
