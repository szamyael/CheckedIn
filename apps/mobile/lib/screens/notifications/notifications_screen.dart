import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';
import 'package:intl/intl.dart';

import '../../services/notification_service.dart';
import '../../widgets/student_ui.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _service = NotificationService();
  late Future<List<AppNotification>> _future;

  @override
  void initState() {
    super.initState();
    _load();
    _service.subscribeToNew((_) {
      if (mounted) setState(() => _future = _service.fetchNotifications());
    });
  }

  void _load() {
    _future = _service.fetchNotifications();
  }

  Future<void> _markAllRead() async {
    await _service.markAllRead();
    if (mounted) setState(() => _future = _service.fetchNotifications());
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy h:mm a');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: _markAllRead,
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _future = _service.fetchNotifications());
          await _future;
        },
        child: FutureBuilder<List<AppNotification>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  const StudentErrorBanner(
                    message:
                        "We couldn't load notifications. Pull down to try again.",
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () =>
                        setState(() => _future = _service.fetchNotifications()),
                    icon: const Icon(TablerIcons.refresh),
                    label: const Text('Try again'),
                  ),
                ],
              );
            }
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final items = snapshot.data!;
            if (items.isEmpty) {
              return ListView(
                children: const [
                  StudentEmptyState(
                    icon: TablerIcons.bell,
                    message: 'No notifications yet.',
                  ),
                ],
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final n = items[index];
                return StudentCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  onTap: () async {
                    if (n.isUnread) {
                      await _service.markRead(n.id);
                      setState(() => _future = _service.fetchNotifications());
                    }
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (n.senderName != null) ...[
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: StudentUi.of(context).neutralBackground,
                              child: n.senderAvatarUrl != null
                                  ? ClipOval(
                                      child: Image.network(
                                        n.senderAvatarUrl!,
                                        width: 36,
                                        height: 36,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) =>
                                            Text(_initials(n.senderName!)),
                                      ),
                                    )
                                  : Text(_initials(n.senderName!)),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    n.senderName!,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (n.senderOrganizationName != null ||
                                      n.senderRole != null)
                                    Text(
                                      [
                                        n.senderOrganizationName,
                                        _roleLabel(n.senderRole),
                                      ].whereType<String>().join(' · '),
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(fontSize: 11),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                      ],
                      Row(
                        children: [
                          Icon(
                            _iconForType(n.type),
                            size: 18,
                            color: n.isUnread
                                ? StudentUi.of(context).accent
                                : StudentUi.of(context).muted,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              n.title,
                              style: TextStyle(
                                fontWeight:
                                    n.isUnread ? FontWeight.w600 : FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Semantics(
                            label: n.isUnread
                                ? 'Unread notification'
                                : 'Read notification',
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: n.isUnread
                                    ? StudentUi.of(context).accentSoft
                                    : StudentUi.of(context).neutralBackground,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                n.isUnread ? 'New' : 'Read',
                                style: TextStyle(
                                  color: n.isUnread
                                      ? StudentUi.of(context).accentText
                                      : StudentUi.of(context).muted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(n.body, style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 6),
                      Text(
                        fmt.format(n.createdAt.toLocal()),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontSize: 11,
                              color: StudentUi.of(context).muted,
                            ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'achievement':
        return TablerIcons.trophy;
      case 'event_published':
        return TablerIcons.calendarEvent;
      default:
        return TablerIcons.bell;
    }
  }

  String _initials(String name) => name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .take(2)
      .map((part) => part[0].toUpperCase())
      .join();

  String? _roleLabel(String? role) {
    switch (role) {
      case 'org_member':
        return 'Organization member';
      case 'admin':
        return 'Administrator';
      case 'faculty':
        return 'Faculty';
      default:
        return role;
    }
  }
}
