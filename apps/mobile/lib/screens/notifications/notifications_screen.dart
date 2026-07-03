import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/notification_service.dart';

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
    _service.subscribeToNew(() {
      if (mounted) setState(() => _future = _service.fetchNotifications());
    });
  }

  void _load() {
    _future = _service.fetchNotifications();
  }

  Future<void> _markAllRead() async {
    await _service.markAllRead();
    setState(() => _future = _service.fetchNotifications());
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
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final items = snapshot.data!;
            if (items.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('No notifications yet.')),
                ],
              );
            }

            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final n = items[index];
                return ListTile(
                  tileColor: n.isUnread ? Colors.blue.shade50 : null,
                  leading: Icon(
                    _iconForType(n.type),
                    color: n.isUnread ? Colors.blue : Colors.grey,
                  ),
                  title: Text(
                    n.title,
                    style: TextStyle(
                      fontWeight:
                          n.isUnread ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(n.body),
                      const SizedBox(height: 4),
                      Text(
                        fmt.format(n.createdAt.toLocal()),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  onTap: () async {
                    if (n.isUnread) {
                      await _service.markRead(n.id);
                      setState(() => _future = _service.fetchNotifications());
                    }
                  },
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
        return Icons.emoji_events;
      case 'event_published':
        return Icons.event;
      case 'account_approved':
        return Icons.verified_user;
      default:
        return Icons.notifications;
    }
  }
}
