import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/registration_draft.dart';
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
  bool _showAllAchievements = false;
  bool _showAllHistory = false;

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
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
              children: [
                const Text('STUDENT RECORD', style: TextStyle(color: StudentUi.muted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
                const SizedBox(height: 8),
                const Text('Profile', style: TextStyle(color: Color(0xFF0C2238), fontSize: 27, fontWeight: FontWeight.w700)),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(color: const Color(0xFF17324D), border: Border.all(color: const Color(0xFF0C2238))),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor: const Color(0xFFE7EEF4),
                            backgroundImage: _avatarUrl != null
                                ? NetworkImage(_avatarUrl!)
                                : null,
                            child: _avatarUrl == null
                                ? Text(
                                    _initials(student),
                                    style: const TextStyle(
                                      color: const Color(0xFF17324D),
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
                                  ? formatStudentDisplayName(
                                      firstName:
                                          student['first_name'] as String?,
                                      middleName:
                                          student['middle_name'] as String?,
                                      lastName: student['last_name'] as String?,
                                      nameExtension:
                                          student['name_extension'] as String?,
                                    )
                                  : 'Student',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      if (student != null) ...[
                        const SizedBox(height: 12),
                        Text('ID: ${student['student_id']}', style: const TextStyle(color: Color(0xFFD7E2EC))),
                        Text('Program: ${student['program']}', style: const TextStyle(color: Color(0xFFD7E2EC))),
                        if (student['year_level'] != null)
                          Text('Year Level: ${student['year_level']}', style: const TextStyle(color: Color(0xFFD7E2EC))),
                        if (student['section'] != null)
                          Text('Section: ${student['section']}', style: const TextStyle(color: Color(0xFFD7E2EC))),
                        if (student['reward_points'] != null)
                          Text(
                            '${student['reward_points']} reward points',
                            style: const TextStyle(
                              color: Color(0xFFF0C46D),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const SizedBox(height: 8),
                        Text('${data.attendanceCount} events attended', style: const TextStyle(color: Color(0xFFD7E2EC))),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: () => context.push('/profile/edit'),
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.white, side: const BorderSide(color: Color(0xFFB7C9D7))),
                          child: const Text('Edit profile'),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Row(children: [Icon(Icons.workspace_premium_outlined, color: Color(0xFFA46618), size: 19), SizedBox(width: 8), Text('Rewards & recognition', style: TextStyle(color: Color(0xFF0C2238), fontSize: 16, fontWeight: FontWeight.w700))]),
                const SizedBox(height: 8),
                if (data.achievements.isEmpty)
                  const StudentEmptyState(
                    icon: Icons.emoji_events_outlined,
                    message: 'No badges yet. Check in to events to earn them!',
                  )
                else
                  ...data.achievements.take(_showAllAchievements ? data.achievements.length : 1).map(
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
                if (data.achievements.length > 1)
                  TextButton(
                    onPressed: () => setState(() => _showAllAchievements = !_showAllAchievements),
                    child: Text(_showAllAchievements ? 'Show recent only' : 'View all ${data.achievements.length} awards'),
                  ),
                const SizedBox(height: 16),
                const Row(children: [Icon(Icons.event_note_outlined, color: Color(0xFF17324D), size: 19), SizedBox(width: 8), Text('Attendance history', style: TextStyle(color: Color(0xFF0C2238), fontSize: 16, fontWeight: FontWeight.w700))]),
                const SizedBox(height: 8),
                if (data.history.isEmpty)
                  const StudentEmptyState(
                    icon: Icons.history,
                    message: 'No attendance records yet.',
                  )
                else
                  ...data.history.take(_showAllHistory ? data.history.length : 1).map(
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
                if (data.history.length > 1)
                  TextButton(
                    onPressed: () => setState(() => _showAllHistory = !_showAllHistory),
                    child: Text(_showAllHistory ? 'Show recent only' : 'View all ${data.history.length} attendance records'),
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
