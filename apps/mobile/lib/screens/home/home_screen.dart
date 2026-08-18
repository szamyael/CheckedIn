import 'package:flutter/material.dart';

import '../../services/profile_service.dart';
import '../../widgets/student_ui.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onScan;
  final VoidCallback? onOpenBingo;

  const HomeScreen({
    super.key,
    required this.onScan,
    this.onOpenBingo,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _profile = ProfileService();
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_HomeData> _load() async {
    final stats = await _profile.fetchDashboardStats();
    final student = await _profile.fetchStudentProfile();
    return _HomeData(
      firstName: student?['first_name'] as String? ?? 'Student',
      stats: stats,
    );
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<_HomeData>(
        future: _future,
        builder: (context, snapshot) {
          final data = snapshot.data;
          final stats = data?.stats ?? {};

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Welcome back',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 4),
              Text(
                data?.firstName ?? '…',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Attended',
                      value: '${stats['attendance_count'] ?? 0}',
                      icon: Icons.event_available,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Points',
                      value: '${stats['reward_points'] ?? 0}',
                      icon: Icons.stars,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Badges',
                      value: '${stats['badge_count'] ?? 0}',
                      icon: Icons.emoji_events,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              StudentCard(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      Icons.qr_code_scanner,
                      size: 64,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Event Check-In',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Scan the event QR code, verify your location, enter OTP if required, and take a live selfie.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: widget.onScan,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Event QR'),
              ),
              const SizedBox(height: 12),
              StudentTealCallout(
                message: 'View Bingo board',
                actionLabel: widget.onOpenBingo != null ? 'Tap to open Bingo tab' : null,
                onTap: widget.onOpenBingo,
              ),
              const SizedBox(height: 12),
              Text(
                'Scan once to check in (location → OTP → selfie). Scan again after check-in to check out — no OTP or selfie needed.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _HomeData {
  final String firstName;
  final Map<String, dynamic> stats;

  _HomeData({required this.firstName, required this.stats});
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return StudentCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: StudentUi.teal,
                  fontWeight: FontWeight.bold,
                ),
          ),
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
