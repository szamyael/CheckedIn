import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../../services/offline_sync_service.dart';
import '../events/events_screen.dart';
import '../profile/profile_screen.dart';
import '../home/home_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  final _notifications = NotificationService();
  final _offlineSync = OfflineSyncService.instance;
  int _unreadCount = 0;

  static const _tabs = [
    _Tab('/home', Icons.home, 'Home'),
    _Tab('/events', Icons.event, 'Events'),
    _Tab('/profile', Icons.person, 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _refreshUnread();
    _notifications.subscribeToNew(_refreshUnread);
    _offlineSync.addListener(_onOfflineChanged);
  }

  @override
  void dispose() {
    _offlineSync.removeListener(_onOfflineChanged);
    super.dispose();
  }

  void _onOfflineChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _refreshUnread() async {
    final count = await _notifications.fetchUnreadCount();
    if (mounted) setState(() => _unreadCount = count);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(onScan: () => context.push('/attendance/scan')),
      const EventsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('CheckedIn'),
        actions: [
          IconButton(
            onPressed: () async {
              await context.push('/notifications');
              _refreshUnread();
            },
            icon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text(_unreadCount > 9 ? '9+' : '$_unreadCount'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (_offlineSync.pendingCount > 0)
            MaterialBanner(
              content: Text(
                _offlineSync.isSyncing
                    ? 'Syncing ${_offlineSync.pendingCount} pending attendance…'
                    : '${_offlineSync.pendingCount} attendance waiting to sync when online',
              ),
              leading: Icon(
                _offlineSync.isSyncing ? Icons.sync : Icons.cloud_off,
                color: Colors.amber.shade800,
              ),
              actions: [
                if (!_offlineSync.isSyncing)
                  TextButton(
                    onPressed: () => _offlineSync.syncPending(),
                    child: const Text('Sync now'),
                  ),
              ],
            ),
          Expanded(child: pages[_index]),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: _tabs
            .map((t) => NavigationDestination(icon: Icon(t.icon), label: t.label))
            .toList(),
      ),
    );
  }
}

class _Tab {
  final String path;
  final IconData icon;
  final String label;
  const _Tab(this.path, this.icon, this.label);
}
