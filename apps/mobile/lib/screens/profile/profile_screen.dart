import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/profile_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _profile = ProfileService();
  late Future<_ProfileData> _future;

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
    return _ProfileData(
      student: results[0] as Map<String, dynamic>?,
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
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student != null
                              ? '${student['first_name']} ${student['last_name']}'
                              : 'Student',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        if (student != null) ...[
                          const SizedBox(height: 8),
                          Text('ID: ${student['student_id']}'),
                          Text('Program: ${student['program']}'),
                          if (student['year_level'] != null)
                            Text('Year Level: ${student['year_level']}'),
                          const SizedBox(height: 8),
                          Text('${data.attendanceCount} events attended'),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Achievements', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.achievements.isEmpty)
                  const Text('No badges yet. Check in to events to earn them!')
                else
                  ...data.achievements.map(
                    (a) => ListTile(
                      leading: Icon(
                        a.badgeType == 'milestone' ? Icons.emoji_events : Icons.verified,
                        color: Colors.amber.shade700,
                      ),
                      title: Text(a.badgeName),
                      subtitle: Text(fmt.format(a.earnedAt.toLocal())),
                    ),
                  ),
                const SizedBox(height: 16),
                Text('Attendance History', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.history.isEmpty)
                  const Text('No attendance records yet.')
                else
                  ...data.history.map(
                    (h) => ListTile(
                      leading: Icon(
                        h.isPending ? Icons.cloud_upload : Icons.check_circle,
                        color: h.isPending ? Colors.amber.shade800 : Colors.green,
                      ),
                      title: Text(h.eventTitle),
                      subtitle: Text(
                        h.isPending
                            ? 'Pending sync • ${fmt.format(h.checkedInAt.toLocal())}'
                            : fmt.format(h.checkedInAt.toLocal()),
                      ),
                      trailing: h.syncError != null
                          ? const Icon(Icons.error_outline, color: Colors.red, size: 20)
                          : null,
                    ),
                  ),
              ],
            );
          },
        ),
    );
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
