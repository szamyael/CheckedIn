import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/notification_service.dart';
import '../../services/profile_service.dart';
import '../../widgets/student_ui.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onScan;
  final VoidCallback? onOpenBingo;
  final VoidCallback? onOpenNotifications;

  const HomeScreen({
    super.key,
    required this.onScan,
    this.onOpenBingo,
    this.onOpenNotifications,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _profile = ProfileService();
  final _notifications = NotificationService();
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
    _notifications.subscribeToNew(() {
      if (mounted) setState(() => _future = _load());
    });
  }

  Future<_HomeData> _load() async {
    final results = await Future.wait([
      _profile.fetchDashboardStats(),
      _profile.fetchStudentProfile(),
      _notifications.fetchNotifications(limit: 12),
    ]);
    final stats = results[0] as Map<String, dynamic>;
    final student = results[1] as Map<String, dynamic>?;
    final announcements = (results[2] as List<AppNotification>)
        .where((notification) => notification.type == 'general')
        .take(3)
        .toList();
    return _HomeData(
      firstName: student?['first_name'] as String? ?? 'Student',
      studentId: student?['student_id'] as String? ?? '—',
      program: student?['program'] as String? ?? 'Program not set',
      yearLevel: student?['year_level'] as int?,
      stats: stats,
      announcements: announcements,
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
          final stats = data?.stats ?? <String, dynamic>{};
          final firstName = data?.firstName ?? '…';

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            children: [
              Text('Good morning,', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 3),
              Text(
                '$firstName.',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: const Color(0xFF0C2238),
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.4,
                    ),
              ),
              const SizedBox(height: 20),
              _CampusPass(
                name: firstName,
                studentId: data?.studentId ?? '—',
                program: data?.program ?? 'Program not set',
                yearLevel: data?.yearLevel,
                onScan: widget.onScan,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _StatTile(
                      label: 'Attended',
                      value: '${stats['attendance_count'] ?? 0}',
                      icon: Icons.event_available_outlined,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _StatTile(
                      label: 'Points',
                      value: '${stats['reward_points'] ?? 0}',
                      icon: Icons.stars_outlined,
                      accent: const Color(0xFFA46618),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _StatTile(
                      label: 'Badges',
                      value: '${stats['badge_count'] ?? 0}',
                      icon: Icons.workspace_premium_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 26),
              const _SectionLabel(label: 'NEXT STEPS'),
              const SizedBox(height: 10),
              _ActionRow(
                icon: Icons.qr_code_scanner,
                title: 'Scan event QR',
                description: 'Check in securely for an event.',
                onTap: widget.onScan,
              ),
              const SizedBox(height: 10),
              _ActionRow(
                icon: Icons.grid_view_rounded,
                title: 'Your Bingo progress',
                description: 'See what participation can unlock next.',
                accent: const Color(0xFFA46618),
                background: const Color(0xFFFFFAF0),
                onTap: widget.onOpenBingo,
              ),
              const SizedBox(height: 26),
              _SectionLabel(label: 'BULLETIN BOARD'),
              const SizedBox(height: 10),
              _BulletinBoard(
                announcements: data?.announcements ?? const [],
                onViewAll: widget.onOpenNotifications,
              ),
              const SizedBox(height: 22),
              const StudentInfoBanner(
                message: 'For check-in, scan the event QR first. We will guide you through location, OTP, and selfie verification if required.',
                icon: Icons.info_outline,
                background: Color(0xFFEEF1F0),
                border: StudentUi.border,
                foreground: StudentUi.muted,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CampusPass extends StatelessWidget {
  final String name;
  final String studentId;
  final String program;
  final int? yearLevel;
  final VoidCallback onScan;

  const _CampusPass({
    required this.name,
    required this.studentId,
    required this.program,
    required this.yearLevel,
    required this.onScan,
  });

  String get _yearLabel {
    if (yearLevel == null) return '';
    final suffix = yearLevel == 1 ? 'st' : yearLevel == 2 ? 'nd' : yearLevel == 3 ? 'rd' : 'th';
    return ' · $yearLevel$suffix Year';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF17324D),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF0C2238)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('YOUR CAMPUS PASS', style: TextStyle(color: Color(0xFFD7E2EC), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
                    const SizedBox(height: 5),
                    Text('$program$_yearLabel', style: const TextStyle(color: Color(0xFFD7E2EC), fontSize: 13)),
                    const SizedBox(height: 20),
                    Text('STUDENT ID · $studentId', style: const TextStyle(color: Color(0xFFD7E2EC), fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 1)),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              InkWell(
                onTap: onScan,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 92,
                  height: 92,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.qr_code_2, color: Colors.white, size: 38),
                      SizedBox(height: 5),
                      Text('SCAN TO CHECK IN', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color accent;

  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    this.accent = const Color(0xFF17324D),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: StudentUi.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: accent),
          const SizedBox(height: 15),
          Text(value, style: TextStyle(color: const Color(0xFF0C2238), fontSize: 21, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: Color(0xFF697178), fontSize: 10, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) => Text(label, style: const TextStyle(color: Color(0xFF697178), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.3));
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback? onTap;
  final Color accent;
  final Color background;

  const _ActionRow({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.accent = const Color(0xFF17324D),
    this.background = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: background, border: Border.all(color: StudentUi.border), borderRadius: BorderRadius.circular(8)),
          child: Row(
            children: [
              Container(width: 42, height: 42, color: accent.withValues(alpha: 0.1), child: Icon(icon, color: accent, size: 21)),
              const SizedBox(width: 13),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: Color(0xFF0C2238), fontSize: 15, fontWeight: FontWeight.w700)), const SizedBox(height: 3), Text(description, style: const TextStyle(color: Color(0xFF697178), fontSize: 12))])),
              Icon(Icons.chevron_right, color: accent),
            ],
          ),
        ),
      ),
    );
  }
}

class _BulletinBoard extends StatelessWidget {
  final List<AppNotification> announcements;
  final VoidCallback? onViewAll;

  const _BulletinBoard({required this.announcements, this.onViewAll});

  @override
  Widget build(BuildContext context) {
    if (announcements.isEmpty) {
      return StudentCard(
        child: Row(
          children: [
            Icon(Icons.campaign_outlined, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 12),
            const Expanded(child: Text('No announcements right now. Check back soon.')),
          ],
        ),
      );
    }

    final fmt = DateFormat('MMM d');
    return StudentCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var index = 0; index < announcements.length; index++) ...[
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                foregroundColor: Theme.of(context).colorScheme.primary,
                child: const Icon(Icons.campaign_outlined),
              ),
              title: Text(announcements[index].title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(announcements[index].body, maxLines: 2, overflow: TextOverflow.ellipsis),
              trailing: Text(fmt.format(announcements[index].createdAt.toLocal()), style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11)),
              onTap: onViewAll,
            ),
            if (index < announcements.length - 1) const Divider(height: 1),
          ],
          if (onViewAll != null)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(onPressed: onViewAll, icon: const Icon(Icons.arrow_forward, size: 17), label: const Text('View all updates')),
            ),
        ],
      ),
    );
  }
}

class _HomeData {
  final String firstName;
  final String studentId;
  final String program;
  final int? yearLevel;
  final Map<String, dynamic> stats;
  final List<AppNotification> announcements;

  _HomeData({required this.firstName, required this.studentId, required this.program, required this.yearLevel, required this.stats, required this.announcements});
}
