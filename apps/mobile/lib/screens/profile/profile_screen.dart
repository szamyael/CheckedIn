import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../services/auth_service.dart';
import '../../services/profile_service.dart';
import '../../widgets/student_ui.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _profile = ProfileService();
  late Future<_ProfileData> _future;
  String? _avatarUrl;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = _loadData();
  }

  Future<_ProfileData> _loadData() async {
    final results = await Future.wait([
      _profile.fetchStudentProfile(),
      _profile.fetchAchievements(),
      _profile.fetchAttendanceHistory(),
      _profile.fetchAttendanceCount(),
    ]);
    final student = results[0] as Map<String, dynamic>?;
    String? avatarUrl;
    final photoPath = student?['profile_photo_url'] as String?;
    if (photoPath != null &&
        photoPath.isNotEmpty &&
        !AuthService.instance.isOfflineMode) {
      try {
        avatarUrl = await Supabase.instance.client.storage
            .from('student-ids')
            .createSignedUrl(photoPath, 3600);
      } catch (_) {
        avatarUrl = null;
      }
    }
    if (mounted) setState(() => _avatarUrl = avatarUrl);
    return _ProfileData(
      student: student,
      achievements: results[1] as List<AchievementItem>,
      history: results[2] as List<AttendanceHistoryItem>,
      attendanceCount: results[3] as int,
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _loadData());
          await _future;
        },
        child: FutureBuilder<_ProfileData>(
          future: _future,
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final data = snapshot.data!;
            final student = data.student;
            final fmt = DateFormat('MMM d, yyyy h:mm a');

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                StudentCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor: StudentUi.tealSoft,
                            backgroundImage: _avatarUrl != null
                                ? NetworkImage(_avatarUrl!)
                                : null,
                            child: _avatarUrl == null
                                ? Text(
                                    _initials(student),
                                    style: const TextStyle(
                                      color: StudentUi.tealText,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 20,
                                    ),
                                  )
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              student != null
                                  ? '${student['first_name']} ${student['last_name']}'
                                  : 'Student',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                        ],
                      ),
                      if (student != null) ...[
                        const SizedBox(height: 12),
                        Text('ID: ${student['student_id']}'),
                        Text('Program: ${student['program']}'),
                        if (student['year_level'] != null)
                          Text('Year Level: ${student['year_level']}'),
                        if (student['section'] != null)
                          Text('Section: ${student['section']}'),
                        if (student['reward_points'] != null)
                          Text(
                            'Reward points: ${student['reward_points']}',
                            style: const TextStyle(
                              color: StudentUi.teal,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const SizedBox(height: 8),
                        Text('${data.attendanceCount} events attended'),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: () => context.push('/profile/edit'),
                          child: const Text('Edit profile'),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text('Achievements', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.achievements.isEmpty)
                  const StudentEmptyState(
                    icon: Icons.emoji_events_outlined,
                    message: 'No badges yet. Check in to events to earn them!',
                  )
                else
                  ...data.achievements.map(
                    (a) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: StudentCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          leading: Icon(
                            a.badgeType == 'milestone'
                                ? Icons.emoji_events
                                : Icons.verified,
                            color: Colors.amber.shade700,
                          ),
                          title: Text(a.badgeName),
                          subtitle: Text(fmt.format(a.earnedAt.toLocal())),
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Text('Attendance History', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.history.isEmpty)
                  const StudentEmptyState(
                    icon: Icons.history,
                    message: 'No attendance records yet.',
                  )
                else
                  ...data.history.map(
                    (h) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: StudentCard(
                        padding: EdgeInsets.zero,
                        child: ListTile(
                          leading: Icon(
                            h.isPending ? Icons.cloud_upload : Icons.check_circle,
                            color: h.isPending
                                ? Colors.amber.shade800
                                : StudentUi.teal,
                          ),
                          title: Text(h.eventTitle),
                          subtitle: Text(
                            h.isPending
                                ? 'Pending sync • ${fmt.format(h.checkedInAt.toLocal())}'
                                : fmt.format(h.checkedInAt.toLocal()),
                          ),
                          trailing: h.syncError != null
                              ? const Icon(
                                  Icons.error_outline,
                                  color: Colors.red,
                                  size: 20,
                                )
                              : null,
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
    );
  }

  String _initials(Map<String, dynamic>? student) {
    final first = (student?['first_name'] as String?)?.trim() ?? '';
    final last = (student?['last_name'] as String?)?.trim() ?? '';
    final a = first.isNotEmpty ? first[0] : '';
    final b = last.isNotEmpty ? last[0] : '';
    final out = '$a$b'.toUpperCase();
    return out.isEmpty ? '?' : out;
  }
}

class _ProfileData {
  final Map<String, dynamic>? student;
  final List<AchievementItem> achievements;
  final List<AttendanceHistoryItem> history;
  final int attendanceCount;

  _ProfileData({
    required this.student,
    required this.achievements,
    required this.history,
    required this.attendanceCount,
  });
}
