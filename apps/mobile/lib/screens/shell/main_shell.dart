import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/auth_service.dart';
import '../../services/connectivity_service.dart';
import '../../services/notification_service.dart';
import '../../services/offline_sync_service.dart';
import '../bingo/bingo_screen.dart';
import '../events/events_screen.dart';
import '../profile/profile_screen.dart';
import '../home/home_screen.dart';
import '../../widgets/app_logo.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  final _notifications = NotificationService();
  final _offlineSync = OfflineSyncService.instance;
  final _auth = AuthService.instance;
  final _connectivity = ConnectivityService.instance;
  int _unreadCount = 0;
  String? _accountStatus;

  static const _tabs = [
    _Tab('/home', Icons.home, 'Home'),
    _Tab('/events', Icons.event, 'Events'),
    _Tab('/bingo', Icons.grid_view_rounded, 'Bingo'),
    _Tab('/profile', Icons.person, 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _refreshUnread();
    _loadAccountStatus();
    _notifications.subscribeToNew(_refreshUnread);
    _offlineSync.addListener(_onOfflineChanged);
    _connectivity.addListener(_onOfflineChanged);
    _auth.addListener(_onOfflineChanged);
  }

  Future<void> _loadAccountStatus() async {
    final status = await _auth.fetchAccountStatus();
    if (mounted) setState(() => _accountStatus = status);
  }

  @override
  void dispose() {
    _offlineSync.removeListener(_onOfflineChanged);
    _connectivity.removeListener(_onOfflineChanged);
    _auth.removeListener(_onOfflineChanged);
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
      const BingoScreen(),
      const ProfileScreen(),
    ];

    final offline = _connectivity.isOffline || _auth.isOfflineMode;

    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(size: 36),
        centerTitle: true,
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
          if (offline)
            MaterialBanner(
              content: Text(
                _auth.isOfflineMode
                    ? 'Offline mode — browsing cached data. Check-ins save on device and sync when you reconnect and sign in online.'
                    : 'No internet — showing cached data. Check-ins will sync when you reconnect.',
              ),
              leading: Icon(Icons.wifi_off, color: Colors.blueGrey.shade700),
              backgroundColor: Colors.blueGrey.shade50,
              actions: const [SizedBox.shrink()],
            ),
          if (_accountStatus == 'pending')
            MaterialBanner(
              content: const Text(
                'Your account is pending admin approval. You can browse the app, but check-in unlocks once approved.',
              ),
              leading: Icon(Icons.hourglass_top, color: Colors.orange.shade800),
              actions: const [SizedBox.shrink()],
            ),
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
                if (!_offlineSync.isSyncing && !_auth.isOfflineMode)
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
