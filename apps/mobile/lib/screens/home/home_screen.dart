import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';

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
    _notifications.subscribeToNew((_) {
      if (mounted) setState(() => _future = _load());
    });
  }

  Future<_HomeData> _load() async {
    final results = await Future.wait([
      _profile.fetchDashboardStats(),
      _profile.fetchStudentProfile(),
      _notifications.fetchNotifications(limit: 12),
      _profile.fetchAttendanceHistory(),
    ]);
    final stats = results[0] as Map<String, dynamic>;
    final student = results[1] as Map<String, dynamic>?;
    final announcements = (results[2] as List<AppNotification>)
        .where((notification) => notification.type == 'general')
        .take(3)
        .toList();
    final history = results[3] as List<AttendanceHistoryItem>;
    final passDetails = await Future.wait<String?>([
      _profile.createStudentAvatarUrl(student?['profile_photo_url'] as String?),
      _profile.fetchCampusPassToken(),
    ]);
    return _HomeData(
      firstName: student?['first_name'] as String? ?? 'Student',
      fullName: [
        student?['first_name'],
        student?['middle_name'],
        student?['last_name'],
      ].whereType<String>().where((part) => part.trim().isNotEmpty).join(' '),
      studentId: student?['student_id'] as String? ?? '—',
      program: student?['program'] as String? ?? 'Program not set',
      yearLevel: student?['year_level'] as int?,
      section: student?['section'] as String?,
      avatarUrl: passDetails[0],
      campusPassToken: passDetails[1],
      stats: stats,
      announcements: announcements,
      history: history,
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
          if (!snapshot.hasData) {
            if (snapshot.hasError) {
              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const StudentErrorBanner(
                    message:
                        "We couldn't load your dashboard. Pull down to try again.",
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => setState(() => _future = _load()),
                    icon: const Icon(TablerIcons.refresh),
                    label: const Text('Try again'),
                  ),
                ],
              );
            }
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.sizeOf(context).height * 0.45,
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 12),
                        Text('Loading your attendance…'),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }

          final colors = Theme.of(context).colorScheme;
          final data = snapshot.data!;
          final stats = data.stats;
          final firstName = data.firstName;
          final now = DateTime.now();
          final greeting = switch (now.hour) {
            < 12 => 'Good morning',
            < 17 => 'Good afternoon',
            _ => 'Good evening',
          };

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
            children: [
              Text(greeting, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 3),
              Text(
                '$firstName.',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 30,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                DateFormat('EEEE, MMM d').format(now),
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 20),
              CampusPassCard(
                name: data.fullName.isNotEmpty ? data.fullName : firstName,
                studentId: data.studentId,
                program: data.program,
                yearLevel: data.yearLevel,
                section: data.section,
                avatarUrl: data.avatarUrl,
                campusPassToken: data.campusPassToken,
                onScan: widget.onScan,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _StatTile(
                      label: 'Attended',
                      value: '${stats['attendance_count'] ?? 0}',
                      icon: TablerIcons.calendarCheck,
                      background: colors.primaryContainer,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _StatTile(
                      label: 'Points',
                      value: '${stats['reward_points'] ?? 0}',
                      icon: TablerIcons.stars,
                      accent: colors.tertiary,
                      background: colors.tertiaryContainer,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const _SectionLabel(label: 'RECENT ATTENDANCE'),
              const SizedBox(height: 10),
              _RecentAttendance(history: data.history),
              const SizedBox(height: 26),
              const _SectionLabel(label: 'NEXT STEPS'),
              const SizedBox(height: 10),
              _ActionRow(
                icon: TablerIcons.layoutGrid,
                title: 'Your Bingo progress',
                description: 'See what participation can unlock next.',
                accent: colors.tertiary,
                background: colors.tertiaryContainer,
                onTap: widget.onOpenBingo,
              ),
              const SizedBox(height: 26),
              _SectionLabel(label: 'BULLETIN BOARD'),
              const SizedBox(height: 10),
              _BulletinBoard(
                announcements: data.announcements,
                onViewAll: widget.onOpenNotifications,
              ),
              const SizedBox(height: 22),
              StudentInfoBanner(
                message:
                    'For check-in, scan the event QR first. We will guide you through location, OTP, and selfie verification if required.',
                icon: TablerIcons.infoCircle,
                background: colors.surfaceContainerHighest,
                border: colors.outline,
                foreground: colors.onSurfaceVariant,
              ),
            ],
          );
        },
      ),
    );
  }
}

class CampusPassCard extends StatefulWidget {
  final String name;
  final String studentId;
  final String program;
  final int? yearLevel;
  final String? section;
  final String? avatarUrl;
  final String? campusPassToken;
  final VoidCallback onScan;

  const CampusPassCard({
    super.key,
    required this.name,
    required this.studentId,
    required this.program,
    required this.yearLevel,
    required this.section,
    required this.avatarUrl,
    required this.campusPassToken,
    required this.onScan,
  });

  @override
  State<CampusPassCard> createState() => _CampusPassCardState();
}

class _CampusPassCardState extends State<CampusPassCard>
    with SingleTickerProviderStateMixin {
  bool _flipped = false;
  late final AnimationController _flipController;
  late final Animation<double> _flipAnimation;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _flipAnimation = CurvedAnimation(
      parent: _flipController,
      curve: Curves.ease,
      reverseCurve: Curves.ease,
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  String get _yearLabel {
    if (widget.yearLevel == null) return '';
    final suffix = widget.yearLevel == 1
        ? 'st'
        : widget.yearLevel == 2
        ? 'nd'
        : widget.yearLevel == 3
        ? 'rd'
        : 'th';
    return ' · ${widget.yearLevel}$suffix Year';
  }

  void _showFullScreenQr() {
    final token = widget.campusPassToken;
    if (token == null) return;
    showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog.fullscreen(
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Student QR code'),
            leading: IconButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              icon: const Icon(Icons.close),
              tooltip: 'Close full-screen QR code',
            ),
          ),
          body: Center(
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Theme.of(dialogContext).colorScheme.outline,
                ),
              ),
              child: QrImageView(
                data: token,
                version: QrVersions.auto,
                size: MediaQuery.sizeOf(dialogContext).shortestSide * 0.72,
                semanticsLabel: 'Student QR code for ${widget.name}',
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _avatar(double size) {
    final initials = widget.name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .map((part) => part[0])
        .take(2)
        .join()
        .toUpperCase();
    return CircleAvatar(
      radius: size / 2,
      backgroundImage: widget.avatarUrl == null
          ? null
          : NetworkImage(widget.avatarUrl!),
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: widget.avatarUrl == null
          ? Text(initials, style: const TextStyle(fontWeight: FontWeight.w700))
          : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      toggled: _flipped,
      label: _flipped ? 'Show campus pass' : 'Show student QR card',
      child: InkWell(
        onTap: () {
          final next = !_flipped;
          setState(() => _flipped = next);
          if (MediaQuery.of(context).disableAnimations) {
            _flipController.value = next ? 1 : 0;
          } else if (next) {
            _flipController.forward();
          } else {
            _flipController.reverse();
          }
        },
        borderRadius: BorderRadius.circular(20),
        child: AnimatedBuilder(
          animation: _flipAnimation,
          builder: (context, child) {
            final progress = _flipAnimation.value;
            return Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateY(math.pi * progress),
              child: progress < 0.5
                  ? _passFront(
                      colors.primaryContainer,
                      colors.onPrimaryContainer,
                    )
                  : Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.rotationY(math.pi),
                      child: _studentCard(),
                    ),
            );
          },
        ),
      ),
    );
  }

  Widget _passFront(Color background, Color foreground) => Container(
    key: const ValueKey('campus-pass-front'),
    width: double.infinity,
    height: 260,
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Theme.of(context).colorScheme.outline),
    ),
    child: Stack(
      children: [
        Positioned.fill(
          right: 148,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'YOUR CAMPUS PASS',
                style: TextStyle(
                  color: foreground,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                ),
              ),
              const Spacer(),
              Text(
                widget.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: foreground,
                  fontSize: 21,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                'STUDENT ID',
                style: TextStyle(
                  color: foreground.withValues(alpha: 0.72),
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              Text(
                widget.studentId,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: foreground,
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                '${widget.program}$_yearLabel${widget.section == null ? '' : ' · ${widget.section}'}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: foreground, fontSize: 13),
              ),
              const Spacer(),
              Text(
                'TAP CARD TO VIEW STUDENT ID',
                style: TextStyle(
                  color: foreground.withValues(alpha: 0.8),
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: SizedBox(
            width: 138,
            height: 138,
            child: TextButton(
              onPressed: widget.onScan,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.all(8),
                backgroundColor: Theme.of(context).colorScheme.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(11),
                  side: BorderSide(
                    color: Theme.of(context).colorScheme.outline,
                  ),
                ),
                foregroundColor: Theme.of(context).colorScheme.onSurface,
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(TablerIcons.qrcode, size: 48),
                  SizedBox(height: 8),
                  Text('Scan event QR', textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );

  Widget _studentCard() => Container(
    key: const ValueKey('campus-pass-qr'),
    width: double.infinity,
    height: 260,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Theme.of(context).colorScheme.outline),
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'STUDENT IDENTIFICATION',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 1,
                color: Theme.of(context).colorScheme.outlineVariant,
              ),
              const SizedBox(height: 12),
              _avatar(48),
              const SizedBox(height: 8),
              Text(
                widget.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                'STUDENT ID',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                widget.studentId,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${widget.program} · ${widget.yearLevel == null ? 'Year not set' : 'Year ${widget.yearLevel}'}${widget.section == null ? '' : ' · ${widget.section}'}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const Spacer(),
              Text(
                'TAP TO RETURN',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        InkWell(
          onTap: widget.campusPassToken == null ? null : _showFullScreenQr,
          borderRadius: BorderRadius.circular(11),
          child: Container(
            width: 138,
            height: 138,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(11),
            ),
            child: widget.campusPassToken == null
                ? const Center(
                    child: Text(
                      'QR unavailable',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black54, fontSize: 11),
                    ),
                  )
                : QrImageView(
                    data: widget.campusPassToken!,
                    version: QrVersions.auto,
                    size: 126,
                    semanticsLabel: 'Tap to enlarge student QR code',
                  ),
          ),
        ),
      ],
    ),
  );
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accent;
  final Color? background;

  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    this.accent,
    this.background,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
      decoration: BoxDecoration(
        color: background ?? Theme.of(context).colorScheme.surface,
        border: Border.all(color: Theme.of(context).colorScheme.outline),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            size: 18,
            color: accent ?? Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: 15),
          Text(
            value,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 21,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).textTheme.bodySmall?.color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) => Text(
    label,
    style: TextStyle(
      color: Theme.of(context).textTheme.bodySmall?.color,
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: 1.3,
    ),
  );
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback? onTap;
  final Color? accent;
  final Color? background;

  const _ActionRow({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
    this.accent,
    this.background,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final rowAccent = accent ?? colorScheme.primary;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: background ?? colorScheme.surface,
            border: Border.all(color: colorScheme.outline),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: rowAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, color: rowAccent, size: 21),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: colorScheme.onSurface,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      description,
                      style: TextStyle(
                        color: Theme.of(context).textTheme.bodySmall?.color,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(TablerIcons.chevronRight, color: rowAccent),
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
            Icon(
              TablerIcons.speakerphone,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('No announcements right now. Check back soon.'),
            ),
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 5,
              ),
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                foregroundColor: Theme.of(context).colorScheme.primary,
                child: const Icon(TablerIcons.speakerphone),
              ),
              title: Text(
                announcements[index].title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(
                announcements[index].body,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: Text(
                fmt.format(announcements[index].createdAt.toLocal()),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(fontSize: 11),
              ),
              onTap: onViewAll,
            ),
            if (index < announcements.length - 1) const Divider(height: 1),
          ],
          if (onViewAll != null)
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onViewAll,
                icon: const Icon(TablerIcons.arrowRight, size: 17),
                label: const Text('View all updates'),
              ),
            ),
        ],
      ),
    );
  }
}

class _RecentAttendance extends StatelessWidget {
  final List<AttendanceHistoryItem> history;

  const _RecentAttendance({required this.history});

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return const StudentCard(
        child: Row(
          children: [
            Icon(TablerIcons.history),
            SizedBox(width: 12),
            Expanded(child: Text('No attendance records yet.')),
          ],
        ),
      );
    }

    return StudentCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var index = 0; index < history.length && index < 2; index++) ...[
            ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 4,
              ),
              leading: Icon(
                history[index].isPending
                    ? TablerIcons.cloudUpload
                    : TablerIcons.circleCheck,
                color: history[index].isPending
                    ? Theme.of(context).colorScheme.tertiary
                    : Theme.of(context).colorScheme.primary,
              ),
              title: Text(
                history[index].eventTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Text(
                '${history[index].isPending ? 'Pending sync' : 'Recorded'} · '
                '${DateFormat('EEE, MMM d, h:mm a').format(history[index].checkedInAt.toLocal())}',
              ),
              trailing: history[index].syncError == null
                  ? null
                  : Semantics(
                      label: 'Attendance needs sync attention',
                      child: Icon(
                        TablerIcons.alertCircle,
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
            ),
            if (index == 0 && history.length > 1) const Divider(height: 1),
          ],
        ],
      ),
    );
  }
}

class _HomeData {
  final String firstName;
  final String fullName;
  final String studentId;
  final String program;
  final int? yearLevel;
  final String? section;
  final String? avatarUrl;
  final String? campusPassToken;
  final Map<String, dynamic> stats;
  final List<AppNotification> announcements;
  final List<AttendanceHistoryItem> history;

  _HomeData({
    required this.firstName,
    required this.fullName,
    required this.studentId,
    required this.program,
    required this.yearLevel,
    required this.section,
    required this.avatarUrl,
    required this.campusPassToken,
    required this.stats,
    required this.announcements,
    required this.history,
  });
}
